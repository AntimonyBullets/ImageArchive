import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {Image} from "../models/image.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import validator from "validator";

const generateAccessAndRefreshTokens = async (userId) =>{
    try {
        const user = await User.findById(userId);
    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
    
        await user.save({validateBeforeSave: false});
    
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while genererating the tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    //Checking if all the required fields are sent and are not empty strings and throwing error otherwise.
    if (
        [fullName, email, username, password].some((field) => !field || field.trim() === "")
    ) {
        throw new ApiError(400, "All the fields are required");
    }

    if(!validator.isEmail(email) || password.length < 8) {
        throw new ApiError(400, "Please provide email and password in valid format");
    }

    //Checking if the database already contains some user with this username or email (i.e. user already exists) and throwing error if that is true.
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    //Getting the path of the files in variables if they are successfully uploaded. If they're not successfully uploaded, we'll get 'undefined' stored in the variables. 
    const avatarLocalPath = req.file?.path;

    //throwing error if 'avatar' is not provided 
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(500, "Some problem occurred while uploading the avatar");
    }

    //creating entry in the database
    const userEntry = await User.create({
        fullName,
        avatar: avatar.url,
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(userEntry._id).select(
        "-password -refreshToken"
    )//removing password nad refreshtoken from the response

    //checking if the user's entry has successfully been created in the database.
    if (!createdUser) {
        throw new ApiError(500, "Some problem occurred while user registration");
    }

    //sending the response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!")
    )

})

const loginUser = asyncHandler(async (req, res) => {

    const { email, username, password } = req.body;

    //checking if at least one of the detail (username or email) is provided.
    if (!username && !email) {
        throw new ApiError(400, "Username or Email is required!")
    }

    //finding the user with given email/username
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    //checking if the password entered by the user is correct or not
    const passwordCheck = await user.isPasswordCorrect(password);

    if (!passwordCheck) {
        throw new ApiError(401, "Incorrect password!");
    }

    // generating access and refresh tokens after successful password validation.
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // retrieving the data of the user (excluding password and refreshToken) which is to be sent in response 
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    //the following object is passed as parameter in res.cookie()
    const options = {
        httpOnly: true, //Ensures the cookie is only accessible via HTTP(S) requests and not accessible to client-side JavaScript.
        secure: false, //Ensures the cookie is only sent over secure HTTPS connections. (we have temparirily set it to false because we are using localhost)
        sameSite: "none"
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options) //sending accessToken as a cookie
        .cookie("refreshToken", refreshToken, options) //sending refreshToken as a cookie
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken }
                //explicitly sending accessToken and refreshToken in the response in case user wants to store them locally
                ,
                "User has logged in!"
            )
        )
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    );
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options) //deleting the "accessToken" from cookies
        .clearCookie("refreshToken", options)//deleting the "refreshToken" from cookies
        .json(new ApiResponse(200, {}, "User logged out!"));
})

const getUserProfile = asyncHandler(async (req,res) =>{
    const {username} = req.params;

    if(!username?.trim()) throw new ApiError(404, "The user does not exist!");

    const user = await User.findOne({username: username}).select("-password -refreshToken");

    if(!user) throw new ApiError(404, "User does not exist!");

    const userObject = user.toObject();
    const images = await Image.find({owner: user._id});

    userObject["images"] = images;

    return res
    .status(200)
    .json(new ApiResponse(200, userObject, "User profile details fetched successfully"));
})
export {registerUser, loginUser, logoutUser, getUserProfile};