import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});// The cloudinary.config() method is used to configure the Cloudinary SDK with the necessary credentials to interact with your Cloudinary account

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", //automatically identifies the resource_type (image, video etc.) of the file uploaded
            folder: "ImageArchive/images"

        });// for uploading the file on cloudinary
    
        console.log(`File uploaded successfully: ${response.url}`);
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch(error){
        fs.unlinkSync(localFilePath); //removing the temporarily saved local file since the upload operation had failed.
        return null;
    }
}

const deleteFromCloudinary = async (cloudinaryURL) =>{
    try {
        if(cloudinaryURL.length === 0) return "Nothing to delete"; // returning a truthy value if the url is an empty string 
        if(!cloudinaryURL) return null; // returning 'null' (a falsy value) if the url does not exist

        //following is the code for extracting just the filename from the cloudinary url
        const pathArr = cloudinaryURL.split("/");
        const fileNameArr = pathArr[pathArr.length - 1].split(".");
        const fileName = fileNameArr[0].trim();
        let response = await cloudinary.uploader.destroy(`ImageArchive/images/${fileName}`, { resource_type: "image"}); //deleting the file

        if(response.result !== 'ok'){
            response = await cloudinary.uploader.destroy(`ImageArchive/images/${fileName}`, { resource_type: "video"});
        }
        if(response.result !== 'ok'){
            response = await cloudinary.uploader.destroy(`ImageArchive/images/${fileName}`, { resource_type: "raw"});
        }
        if (response.result === 'ok') {
            return {
              success: true,
              message: `File ${fileName} deleted successfully`
            };
        }
        else {
            throw new Error(`Failed to delete the file`);
          }
    } catch (error) {
        return false; //returning a falsy value if there's some error
    }
}
export {uploadOnCloudinary, deleteFromCloudinary};