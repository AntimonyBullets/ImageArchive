import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Image } from "../models/image.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const uploadImage = asyncHandler(async (req, res)=>{
    const { description } = req.body;

    const imageLocalPath = req.file?.path;

    if(!imageLocalPath) throw new ApiError(400, "Image is required");

    const imageFile = await uploadOnCloudinary(imageLocalPath);
    if(!imageFile) throw new ApiError(500, "Some error occurred while uploading the image");

    const image = await Image.create({
        description: description || "",
        image: imageFile.url,
        owner: req.user._id
    });

    if(!image) throw new ApiError("Some problem occurred while saving the image");

    const populatedImage = await Image.findById(image._id).populate('owner', 'username fullName avatar');

    if(!populatedImage) throw new ApiError("Some problem occurred while saving the image");

    return res
    .status(200)
    .json(new ApiResponse(200, populatedImage, "Image was uploaded successfully!"))

});

const deleteImage = asyncHandler(async (req,res)=>{
    const {imageId} = req.params;

    if(!imageId || !mongoose.isValidObjectId(imageId)) throw new ApiError(404, "Image does not exist!");

    const image = await Image.findOne(
        { _id: imageId, owner: req.user._id}
    );

    if(!image) throw new ApiError(404, "Image does not exist or Unauthorized request");

    const deleteImageFile = await deleteFromCloudinary(image.image);

    if(!deleteImageFile) throw new ApiError(500, "Some problem occurred while deleting the image");

    const deletedImage = await Image.deleteOne({_id: imageId});

    if(!deletedImage.deletedCount) throw new ApiError(500, "Some error occurred while removing the image");

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Image was deleted successfully!"))
});

const getImageById = asyncHandler(async (req,res)=>{
    const {imageId} = req.params;

    if(!imageId || !mongoose.isValidObjectId(imageId)) throw new ApiError(404, "Image does not exist!");

    const image = await Image.findById(imageId).populate('owner', 'username fullName avatar');

    if(!image) throw new ApiError(404, "Image does not exist");

    return res
    .status(200)
    .json(new ApiResponse(200, image, "Image fetched successfully!"))
})

const getRecentImages = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    
    const skip = (page - 1) * limit;
    
    const images = await Image.find()
        .sort({ createdAt: -1 })  // Newest first
        .skip(skip)
        .limit(limit)
        .populate('owner', 'username fullName avatar');
    
    const totalImages = await Image.countDocuments();
    
    const totalPages = Math.ceil(totalImages / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {
                    images,
                    pagination: {
                        page,
                        limit,
                        totalImages,
                        totalPages,
                        hasNext,
                        hasPrev
                    }
                }, 
                "Recent images fetched successfully!"
            )
        );
});

export { uploadImage, deleteImage, getImageById, getRecentImages };