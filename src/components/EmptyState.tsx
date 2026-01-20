import { NotebookPen } from "lucide-react";

export function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="glass w-20 h-20 rounded-2xl flex items-center justify-center mb-6 animate-float">
                <NotebookPen className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No notes yet</h3>
            <p className="text-zinc-400 max-w-sm">
                Create your first note by clicking the &quot;New Note&quot; button above.
                Start capturing your thoughts!
            </p>
        </div>
    );
}
