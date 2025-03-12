import mongoose, {Schema} from "mongoose";

const imageSchema = new Schema({
    title:{
        type: String,
        required: true,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    image: {
        type: String, //cloudinary url
        required: true
    }
}, {timestamps: true});

export const Image = mongoose.model('Image', imageSchema);