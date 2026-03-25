"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { cookies } from "next/headers";

type Workspace = "personal" | "ceo";

// Helper to get current user ID (personal mode)
async function getCurrentUserId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user.id;
}

// Helper to verify CEO session
async function verifyCEO(): Promise<void> {
    const cookieStore = await cookies();
    const ceoCookie = cookieStore.get("ceo-session");
    if (ceoCookie?.value !== "authenticated") {
        throw new Error("Unauthorized");
    }
}

// Get the revalidation path for a workspace
function getRevalidationPath(workspace: Workspace): string {
    return workspace === "ceo" ? "/ceo/dashboard" : "/dashboard";
}

// Build the query filter based on workspace
async function buildFilter(workspace: Workspace): Promise<Record<string, unknown>> {
    if (workspace === "ceo") {
        await verifyCEO();
        return { workspace: "ceo" };
    } else {
        const userId = await getCurrentUserId();
        return { userId: new mongoose.Types.ObjectId(userId), workspace: { $ne: "ceo" } };
    }
}

// Serialize note for client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeNote(note: any) {
    return {
        _id: note._id.toString(),
        title: note.title,
        content: note.content,
        pinned: note.pinned,
        workspace: note.workspace || "personal",
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
    };
}

export type SerializedNote = ReturnType<typeof serializeNote>;

// Get all notes for current workspace
export async function getNotes(workspace: Workspace = "personal") {
    try {
        const filter = await buildFilter(workspace);
        await connectDB();

        const notes = await Note.find(filter)
            .sort({ pinned: -1, updatedAt: -1 })
            .lean();

        return { success: true, notes: notes.map(serializeNote) };
    } catch (error) {
        console.error("Error getting notes:", error);
        return { success: false, error: "Failed to get notes", notes: [] };
    }
}

// Create a new note
export async function createNote(title: string, content: string, workspace: Workspace = "personal") {
    try {
        await connectDB();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noteData: any = {
            title: title.trim(),
            content,
            workspace,
            pinned: false,
        };

        if (workspace === "ceo") {
            await verifyCEO();
        } else {
            const userId = await getCurrentUserId();
            noteData.userId = new mongoose.Types.ObjectId(userId);
        }

        const note = await Note.create(noteData);

        revalidatePath(getRevalidationPath(workspace));
        return { success: true, note: serializeNote(note) };
    } catch (error) {
        console.error("Error creating note:", error);
        return { success: false, error: "Failed to create note" };
    }
}

// Update an existing note
export async function updateNote(noteId: string, title: string, content: string, workspace: Workspace = "personal") {
    try {
        await connectDB();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = { _id: new mongoose.Types.ObjectId(noteId) };

        if (workspace === "ceo") {
            await verifyCEO();
            filter.workspace = "ceo";
        } else {
            const userId = await getCurrentUserId();
            filter.userId = new mongoose.Types.ObjectId(userId);
        }

        const note = await Note.findOneAndUpdate(
            filter,
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

        revalidatePath(getRevalidationPath(workspace));
        return { success: true, note: serializeNote(note) };
    } catch (error) {
        console.error("Error updating note:", error);
        return { success: false, error: "Failed to update note" };
    }
}

// Delete a note
export async function deleteNote(noteId: string, workspace: Workspace = "personal") {
    try {
        await connectDB();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = { _id: new mongoose.Types.ObjectId(noteId) };

        if (workspace === "ceo") {
            await verifyCEO();
            filter.workspace = "ceo";
        } else {
            const userId = await getCurrentUserId();
            filter.userId = new mongoose.Types.ObjectId(userId);
        }

        const result = await Note.deleteOne(filter);

        if (result.deletedCount === 0) {
            return { success: false, error: "Note not found" };
        }

        revalidatePath(getRevalidationPath(workspace));
        return { success: true };
    } catch (error) {
        console.error("Error deleting note:", error);
        return { success: false, error: "Failed to delete note" };
    }
}

// Toggle pin status
export async function togglePin(noteId: string, workspace: Workspace = "personal") {
    try {
        await connectDB();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = { _id: new mongoose.Types.ObjectId(noteId) };

        if (workspace === "ceo") {
            await verifyCEO();
            filter.workspace = "ceo";
        } else {
            const userId = await getCurrentUserId();
            filter.userId = new mongoose.Types.ObjectId(userId);
        }

        const note = await Note.findOne(filter);

        if (!note) {
            return { success: false, error: "Note not found" };
        }

        note.pinned = !note.pinned;
        await note.save();

        revalidatePath(getRevalidationPath(workspace));
        return { success: true, pinned: note.pinned };
    } catch (error) {
        console.error("Error toggling pin:", error);
        return { success: false, error: "Failed to toggle pin" };
    }
}

// Search notes
export async function searchNotes(query: string, workspace: Workspace = "personal") {
    try {
        if (!query.trim()) {
            return getNotes(workspace);
        }

        await connectDB();

        const searchRegex = new RegExp(query.trim(), "i");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {
            $or: [
                { title: searchRegex },
                { content: searchRegex },
            ],
        };

        if (workspace === "ceo") {
            await verifyCEO();
            filter.workspace = "ceo";
        } else {
            const userId = await getCurrentUserId();
            filter.userId = new mongoose.Types.ObjectId(userId);
            filter.workspace = { $ne: "ceo" };
        }

        const notes = await Note.find(filter)
            .sort({ pinned: -1, updatedAt: -1 })
            .lean();

        return { success: true, notes: notes.map(serializeNote) };
    } catch (error) {
        console.error("Error searching notes:", error);
        return { success: false, error: "Failed to search notes", notes: [] };
    }
}
