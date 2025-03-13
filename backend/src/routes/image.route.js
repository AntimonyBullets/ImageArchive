import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {deleteImage, getImageById, uploadImage} from "../controllers/image.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.use(verifyJWT);

router
.route("/upload")
    .post(upload.single("image"), uploadImage);

router
.route("/:imageId")
    .delete(deleteImage)
    .get(getImageById);

export default router;