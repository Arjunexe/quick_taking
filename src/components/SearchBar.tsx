"use client";

import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { searchNotes, getNotes, type SerializedNote } from "@/actions/notes";

interface SearchBarProps {
    onSearch: (notes: SerializedNote[]) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSearch = useCallback((searchQuery: string) => {
        startTransition(async () => {
            if (searchQuery.trim() === "") {
                const result = await getNotes();
                onSearch(result.notes);
            } else {
                const result = await searchNotes(searchQuery);
                onSearch(result.notes);
            }
        });
    }, [onSearch]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleSearch(query);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, handleSearch]);

    const clearSearch = () => {
        setQuery("");
    };

    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className={`w-5 h-5 ${isPending ? "text-primary animate-pulse" : "text-zinc-500"}`} />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes..."
                className="glass-input pl-12 pr-10"
            />
            {query && (
                <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
