import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, NotebookPen, Users } from "lucide-react";

export async function CEONavbar() {
    return (
        <nav className="glass border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/ceo/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <NotebookPen className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gradient">QuickTaking</span>
                    </Link>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        {/* CEO Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">CEO</span>
                        </div>

                        {/* Switch to Personal */}
                        <Link
                            href="/signin"
                            className="glass-button flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors"
                            title="Switch to Personal mode"
                        >
                            <NotebookPen className="w-4 h-4" />
                            <span className="hidden sm:inline">Personal</span>
                        </Link>

                        {/* Sign Out Button */}
                        <form
                            action={async () => {
                                "use server";
                                const cookieStore = await cookies();
                                cookieStore.delete("ceo-session");
                                redirect("/");
                            }}
                        >
                            <button
                                type="submit"
                                className="glass-button flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Sign out</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </nav>
    );
}
