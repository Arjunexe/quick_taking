"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user.id;
}

// Serialize note for client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeNote(note: any) {
    return {
        _id: note._id.toString(),
        title: note.title,
        content: note.content,
        pinned: note.pinned,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
    };
}

export type SerializedNote = ReturnType<typeof serializeNote>;

// Get all notes for current user
export async function getNotes() {
    try {
        const userId = await getCurrentUserId();
        await connectDB();

        const notes = await Note.find({ userId: new mongoose.Types.ObjectId(userId) })
            .sort({ pinned: -1, updatedAt: -1 })
            .lean();

        return { success: true, notes: notes.map(serializeNote) };
    } catch (error) {
        console.error("Error getting notes:", error);
        return { success: false, error: "Failed to get notes", notes: [] };
    }
}

// Create a new note
export async function createNote(title: string, content: string) {
    try {
        const userId = await getCurrentUserId();
        await connectDB();

        const note = await Note.create({
            title: title.trim(),
            content,
            userId: new mongoose.Types.ObjectId(userId),
            pinned: false,
        });

        revalidatePath("/dashboard");
        return { success: true, note: serializeNote(note) };
    } catch (error) {
        console.error("Error creating note:", error);
        return { success: false, error: "Failed to create note" };
    }
}

// Update an existing note
export async function updateNote(noteId: string, title: string, content: string) {
    try {
        const userId = await getCurrentUserId();
        await connectDB();

        const note = await Note.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(noteId),
                userId: new mongoose.Types.ObjectId(userId)
            },
            {
                title: title.trim(),
                content,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!note) {
            return { success: false, error: "Note not found" };
        }

        revalidatePath("/dashboard");
        return { success: true, note: serializeNote(note) };
    } catch (error) {
        console.error("Error updating note:", error);
        return { success: false, error: "Failed to update note" };
    }
}

// Delete a note
export async function deleteNote(noteId: string) {
    try {
        const userId = await getCurrentUserId();
        await connectDB();

        const result = await Note.deleteOne({
            _id: new mongoose.Types.ObjectId(noteId),
            userId: new mongoose.Types.ObjectId(userId),
        });

        if (result.deletedCount === 0) {
            return { success: false, error: "Note not found" };
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error deleting note:", error);
        return { success: false, error: "Failed to delete note" };
    }
}

// Toggle pin status
export async function togglePin(noteId: string) {
    try {
        const userId = await getCurrentUserId();
        await connectDB();

        const note = await Note.findOne({
            _id: new mongoose.Types.ObjectId(noteId),
            userId: new mongoose.Types.ObjectId(userId),
        });

        if (!note) {
            return { success: false, error: "Note not found" };
        }

        note.pinned = !note.pinned;
        await note.save();

        revalidatePath("/dashboard");
        return { success: true, pinned: note.pinned };
    } catch (error) {
        console.error("Error toggling pin:", error);
        return { success: false, error: "Failed to toggle pin" };
    }
}

// Search notes
export async function searchNotes(query: string) {
    try {
        const userId = await getCurrentUserId();
        await connectDB();

        if (!query.trim()) {
            return getNotes();
        }

        const searchRegex = new RegExp(query.trim(), "i");

        const notes = await Note.find({
            userId: new mongoose.Types.ObjectId(userId),
            $or: [
                { title: searchRegex },
                { content: searchRegex },
            ],
        })
            .sort({ pinned: -1, updatedAt: -1 })
            .lean();

        return { success: true, notes: notes.map(serializeNote) };
    } catch (error) {
        console.error("Error searching notes:", error);
        return { success: false, error: "Failed to search notes", notes: [] };
    }
}
