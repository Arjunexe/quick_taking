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

          {/* Modal Container - Full screen on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-4"
          >
            <div
              className="glass-card w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl rounded-none flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-border md:border-none shrink-0">
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
              <form
                onSubmit={handleSubmit}
                className="flex-1 flex flex-col gap-4 overflow-hidden p-4 pb-6 md:p-6 md:pt-0"
              >
                {/* Title Input */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title..."
                  className="glass-input text-lg font-medium w-full shrink-0"
                  autoFocus
                  required
                />

                {/* Content Textarea */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing..."
                  className="glass-input flex-1 min-h-0 w-full resize-none"
                />

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border shrink-0">
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
