import { Router } from "express";
import { getUserProfile, loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router
.route("/register")
    .post(
        upload.single("avatar"),
        registerUser
    );

router
.route("/login")
    .post(loginUser);

router
.route("/logout")
    .post(verifyJWT, logoutUser);

router
.route("/:username")
    .get(getUserProfile);


export default router;