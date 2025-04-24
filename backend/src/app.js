import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: '*',
    credentials: false
}));

app.use(express.json({limit: "16kb"}));

app.use(express.urlencoded({extended:true, limit:"16kb"}));
app.use(express.static("public"));

app.use(cookieParser());

import userRouter from "./routes/user.route.js";
import imageRouter from "./routes/image.route.js";

app.use("/api/v1/users", userRouter);

app.use("/api/v1/images", imageRouter)

export {app}