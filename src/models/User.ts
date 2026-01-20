import mongoose, { Schema, models, model } from "mongoose";

export interface IUser {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    image?: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
        },
        image: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const User = models?.User || model<IUser>("User", UserSchema);
