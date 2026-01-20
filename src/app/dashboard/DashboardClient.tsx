"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { NoteCard } from "@/components/NoteCard";
import { NoteModal } from "@/components/NoteModal";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";
import { type SerializedNote } from "@/actions/notes";

interface DashboardClientProps {
    initialNotes: SerializedNote[];
}

export function DashboardClient({ initialNotes }: DashboardClientProps) {
    const [notes, setNotes] = useState<SerializedNote[]>(initialNotes);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<SerializedNote | null>(null);

    const pinnedNotes = notes.filter(note => note.pinned);
    const unpinnedNotes = notes.filter(note => !note.pinned);

    const handleSearch = useCallback((searchResults: SerializedNote[]) => {
        setNotes(searchResults);
    }, []);

    const handleNewNote = () => {
        setEditingNote(null);
        setIsModalOpen(true);
    };

    const handleEditNote = (note: SerializedNote) => {
        setEditingNote(note);
        setIsModalOpen(true);
    };

    const handleSaveNote = (savedNote: SerializedNote) => {
        setNotes(prevNotes => {
            const existingIndex = prevNotes.findIndex(n => n._id === savedNote._id);
            if (existingIndex >= 0) {
                // Update existing note
                const updated = [...prevNotes];
                updated[existingIndex] = savedNote;
                return updated;
            } else {
                // Add new note
                return [savedNote, ...prevNotes];
            }
        });
    };

    const handleDeleteNote = (noteId: string) => {
        setNotes(prevNotes => prevNotes.filter(n => n._id !== noteId));
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
                <div className="flex-1 w-full sm:max-w-md">
                    <SearchBar onSearch={handleSearch} />
                </div>

                <button
                    onClick={handleNewNote}
                    className="glass-button bg-gradient-to-r from-primary to-secondary text-white flex items-center gap-2 px-6 py-3 hover:scale-105 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                    New Note
                </button>
            </div>

            {notes.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-8">
                    {/* Pinned Notes Section */}
                    {pinnedNotes.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                Pinned
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {pinnedNotes.map((note, index) => (
                                    <NoteCard
                                        key={note._id}
                                        note={note}
                                        onEdit={handleEditNote}
                                        onDelete={handleDeleteNote}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* All Notes Section */}
                    {unpinnedNotes.length > 0 && (
                        <section>
                            {pinnedNotes.length > 0 && (
                                <h2 className="text-lg font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-secondary" />
                                    Notes
                                </h2>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {unpinnedNotes.map((note, index) => (
                                    <NoteCard
                                        key={note._id}
                                        note={note}
                                        onEdit={handleEditNote}
                                        onDelete={handleDeleteNote}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* Note Modal */}
            <NoteModal
                note={editingNote}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingNote(null);
                }}
                onSave={handleSaveNote}
            />
        </>
    );
}
