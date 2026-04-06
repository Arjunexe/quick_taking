"use client";

import { X, Save, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { createNote, updateNote, type SerializedNote } from "@/actions/notes";
import { ChecklistEditor } from "@/components/ChecklistEditor";

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
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTitle = useRef("");
  const lastSavedContent = useRef("");

  // Track if there are unsaved changes
  const hasUnsavedChanges = title !== lastSavedTitle.current || content !== lastSavedContent.current;

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
      setCurrentNoteId(note._id);
      lastSavedTitle.current = note.title;
      lastSavedContent.current = note.content;
    } else {
      setTitle("");
      setContent("");
      setCurrentNoteId(null);
      lastSavedTitle.current = "";
      lastSavedContent.current = "";
    }
    setSaveStatus("idle");
  }, [note, isOpen]);

  // Auto-save with debounce
  const performAutoSave = useCallback((currentTitle: string, currentContent: string, noteId: string | null, showIndicator = false) => {
    if (!currentTitle.trim()) return;
    if (currentTitle === lastSavedTitle.current && currentContent === lastSavedContent.current) return;

    if (showIndicator) setSaveStatus("saving");
    startTransition(async () => {
      if (noteId) {
        const result = await updateNote(noteId, currentTitle, currentContent, workspace);
        if (result.success && result.note) {
          lastSavedTitle.current = currentTitle;
          lastSavedContent.current = currentContent;
          onSave(result.note);
          if (showIndicator) {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          }
        }
      } else {
        const result = await createNote(currentTitle, currentContent, workspace);
        if (result.success && result.note) {
          setCurrentNoteId(result.note._id);
          lastSavedTitle.current = currentTitle;
          lastSavedContent.current = currentContent;
          onSave(result.note);
          if (showIndicator) {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          }
        }
      }
    });
  }, [workspace, onSave, startTransition]);

  // Debounced auto-save trigger
  useEffect(() => {
    if (!isOpen) return;
    if (!title.trim()) return;
    if (title === lastSavedTitle.current && content === lastSavedContent.current) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      performAutoSave(title, content, currentNoteId);
    }, 2000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [title, content, isOpen, currentNoteId, performAutoSave]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    performAutoSave(title, content, currentNoteId, true);
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
          handleSubmit();
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
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gradient">
                    {note || currentNoteId ? "Edit Note" : "New Note"}
                  </h2>
                  {/* Auto-save status */}
                  <AnimatePresence mode="wait">
                    {saveStatus === "saving" && (
                      <motion.span
                        key="saving"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex items-center gap-1.5 text-xs text-zinc-500"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                      </motion.span>
                    )}
                    {saveStatus === "saved" && (
                      <motion.span
                        key="saved"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex items-center gap-1.5 text-xs text-emerald-400"
                      >
                        <Check className="w-3 h-3" />
                        Saved
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-surface-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div
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

                {/* Content Editor */}
                <ChecklistEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing... (press \ for bullet, ] for checkbox)"
                  className="glass-input flex-1 min-h-[200px]"
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
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || !title.trim()}
                    className="glass-button bg-gradient-to-r from-primary to-secondary text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
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
