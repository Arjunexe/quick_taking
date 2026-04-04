"use client";

import { X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useTransition, useEffect, useRef } from "react";
import { createNote, updateNote, type SerializedNote } from "@/actions/notes";

interface NoteModalProps {
  note: SerializedNote | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: SerializedNote) => void;
  workspace?: "personal" | "ceo";
}

export function NoteModal({ note, isOpen, onClose, onSave, workspace = "personal" }: NoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  // Track if there are unsaved changes
  const hasUnsavedChanges = note
    ? title !== note.title || content !== note.content
    : title.trim() !== "" || content.trim() !== "";

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardPrompt(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    setShowDiscardPrompt(false);
    onClose();
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
        const result = await updateNote(note._id, title, content, workspace);
        if (result.success && result.note) {
          onSave(result.note);
        }
      } else {
        const result = await createNote(title, content, workspace);
        if (result.success && result.note) {
          onSave(result.note);
        }
      }
    });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
      // Shift+Enter to save
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        if (title.trim() && !isPending) {
          formRef.current?.requestSubmit();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose, title, isPending]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal Container - Full screen on mobile, centered on desktop */}
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-4"
          >
            <div
              className="glass-card w-full h-full md:w-[calc(100%-4rem)] md:h-[calc(100%-4rem)] md:max-w-6xl md:rounded-2xl rounded-none flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-border md:border-none shrink-0">
                <h2 className="text-xl font-semibold text-gradient">
                  {note ? "Edit Note" : "New Note"}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-surface-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex-1 flex flex-col gap-4 overflow-hidden p-4 md:p-6 md:pt-0"
              >
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
                  onKeyDown={(e) => {
                    const textarea = e.currentTarget;
                    const { selectionStart } = textarea;
                    const beforeCursor = content.slice(0, selectionStart);
                    const afterCursor = content.slice(selectionStart);

                    // '\' at start of line → insert bullet
                    if (e.key === "\\") {
                      const lineStart = beforeCursor.lastIndexOf("\n") + 1;
                      const currentLine = beforeCursor.slice(lineStart);
                      if (currentLine.trim() === "") {
                        e.preventDefault();
                        const newContent = beforeCursor + "• " + afterCursor;
                        setContent(newContent);
                        requestAnimationFrame(() => {
                          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
                        });
                      }
                    }

                    // Enter after a bullet line → auto-continue bullet
                    if (e.key === "Enter" && !e.shiftKey) {
                      const lineStart = beforeCursor.lastIndexOf("\n") + 1;
                      const currentLine = beforeCursor.slice(lineStart);
                      if (currentLine.startsWith("• ") && currentLine.trim() !== "•") {
                        e.preventDefault();
                        const newContent = beforeCursor + "\n• " + afterCursor;
                        setContent(newContent);
                        requestAnimationFrame(() => {
                          textarea.selectionStart = textarea.selectionEnd = selectionStart + 3;
                        });
                      }
                      // Empty bullet line → remove it on Enter
                      if (currentLine.trim() === "•") {
                        e.preventDefault();
                        const newContent = content.slice(0, lineStart) + afterCursor;
                        setContent(newContent);
                        requestAnimationFrame(() => {
                          textarea.selectionStart = textarea.selectionEnd = lineStart;
                        });
                      }
                    }
                  }}
                  placeholder="Start writing... (press \ for bullet)"
                  className="glass-input flex-1 min-h-[200px] resize-none"
                />

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border shrink-0">
                  <button
                    type="button"
                    onClick={handleClose}
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

      {/* Discard Changes Dialog */}
      {showDiscardPrompt && (
        <>
          <motion.div
            key="discard-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={() => setShowDiscardPrompt(false)}
          />
          <motion.div
            key="discard-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.25 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div className="glass-card max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-2">Discard changes?</h3>
              <p className="text-sm text-zinc-400 mb-6">
                You have unsaved changes that will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDiscardPrompt(false)}
                  className="flex-1 glass-button text-zinc-300 hover:text-white"
                >
                  Keep editing
                </button>
                <button
                  onClick={handleDiscard}
                  className="flex-1 glass-button bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                >
                  Discard
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
