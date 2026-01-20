"use client";

import { Pin, Trash2, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import { togglePin, deleteNote, type SerializedNote } from "@/actions/notes";
import { useState, useTransition } from "react";

interface NoteCardProps {
    note: SerializedNote;
    onEdit: (note: SerializedNote) => void;
    onDelete: (noteId: string) => void;
    index: number;
}

export function NoteCard({ note, onEdit, onDelete, index }: NoteCardProps) {
    const [isPinPending, startPinTransition] = useTransition();
    const [isDeletePending, startDeleteTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleTogglePin = () => {
        startPinTransition(async () => {
            await togglePin(note._id);
        });
    };

    const handleDelete = () => {
        setIsDeleting(true);
        startDeleteTransition(async () => {
            const result = await deleteNote(note._id);
            if (result.success) {
                onDelete(note._id);
            }
            setIsDeleting(false);
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const truncateContent = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.slice(0, maxLength).trim() + "...";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isDeleting ? 0 : 1, y: isDeleting ? -20 : 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative group"
        >
            {/* Pin Indicator */}
            {note.pinned && (
                <div className="pin-indicator">
                    <Pin className="w-3 h-3 text-white" />
                </div>
            )}

            <div
                className="glass-card h-full cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                onClick={() => onEdit(note)}
            >
                {/* Title */}
                <h3 className="font-semibold text-lg mb-2 text-white line-clamp-2">
                    {note.title || "Untitled"}
                </h3>

                {/* Content Preview */}
                <p className="text-zinc-400 text-sm mb-4 line-clamp-4">
                    {truncateContent(note.content) || "No content"}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <span className="text-xs text-zinc-500">
                        {formatDate(note.updatedAt)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePin();
                            }}
                            disabled={isPinPending}
                            className={`p-2 rounded-lg transition-colors ${note.pinned
                                    ? "text-primary bg-primary/10 hover:bg-primary/20"
                                    : "text-zinc-500 hover:text-primary hover:bg-surface-hover"
                                } ${isPinPending ? "opacity-50" : ""}`}
                            title={note.pinned ? "Unpin" : "Pin"}
                        >
                            <Pin className="w-4 h-4" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(note);
                            }}
                            className="p-2 rounded-lg text-zinc-500 hover:text-secondary hover:bg-surface-hover transition-colors"
                            title="Edit"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to delete this note?")) {
                                    handleDelete();
                                }
                            }}
                            disabled={isDeletePending}
                            className={`p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors ${isDeletePending ? "opacity-50" : ""
                                }`}
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
