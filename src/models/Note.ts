import mongoose, { Schema, models, model } from "mongoose";

export interface INote {
    _id: mongoose.Types.ObjectId;
    title: string;
    content: string;
    userId: mongoose.Types.ObjectId;
    pinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        content: {
            type: String,
            default: "",
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        pinned: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient querying
NoteSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });

// Text index for search
NoteSchema.index({ title: "text", content: "text" });

export const Note = models.Note || model<INote>("Note", NoteSchema);
