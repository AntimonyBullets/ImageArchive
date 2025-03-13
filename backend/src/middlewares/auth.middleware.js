import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, res, next)=>{
    //this middleware performs the authorization of user
try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        //getting the accessToken either from cookies or from the 'Authorization' header of request body. We are replacing "Bearer " with "" because the value of 'Authorization' key in the headers of request body is sent in the form "Bearer <accessToken>". So we'll extract only <accessToken> from it and save it in 'token'.
    
        if(!token){
            throw new ApiError(401, "Unauthorized request!");
        };
        //throwing error if accessToken not found
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        //this method verifies if the 'token' is correct and returns the data which was initially used to generate the access token.
    
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken');//finding the user by his id (we have the access of user's id in 'decodedToken' since we had used this data while intially generating this access token, it can be seen in user.model.js)
    
        if(!user){
            throw new ApiError(401, "Invalid access token");
        }
    
        req.user = user; //adding the user in the request body
        next();
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
}
})