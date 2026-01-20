"use client";

import { X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useTransition, useEffect } from "react";
import { createNote, updateNote, type SerializedNote } from "@/actions/notes";

interface NoteModalProps {
    note: SerializedNote | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (note: SerializedNote) => void;
}

export function NoteModal({ note, isOpen, onClose, onSave }: NoteModalProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();

    // Populate form when editing
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content);
        } else {
            setTitle("");
            setContent("");
        }
    }, [note, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            return;
        }

        startTransition(async () => {
            if (note) {
                const result = await updateNote(note._id, title, content);
                if (result.success && result.note) {
                    onSave(result.note);
                    onClose();
                }
            } else {
                const result = await createNote(title, content);
                if (result.success && result.note) {
                    onSave(result.note);
                    onClose();
                }
            }
        });
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal Container - Flexbox centering */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="glass-card w-full max-w-2xl flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gradient">
                                    {note ? "Edit Note" : "New Note"}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-surface-hover transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-hidden">
                                {/* Title Input */}
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Note title..."
                                    className="glass-input text-lg font-medium"
                                    autoFocus
                                    required
                                />

                                {/* Content Textarea */}
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Start writing..."
                                    className="glass-input flex-1 min-h-[200px] resize-none"
                                />

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="glass-button text-zinc-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPending || !title.trim()}
                                        className="glass-button bg-gradient-to-r from-primary to-secondary text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isPending ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
