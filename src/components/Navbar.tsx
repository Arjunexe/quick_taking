import { signOut } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import { LogOut, NotebookPen } from "lucide-react";

interface NavbarProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function Navbar({ user }: NavbarProps) {
    return (
        <nav className="glass border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <NotebookPen className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gradient">QuickTaking</span>
                    </Link>

                    {/* User Section */}
                    <div className="flex items-center gap-4">
                        {/* User Info */}
                        <div className="hidden sm:flex items-center gap-3">
                            {user.image && (
                                <Image
                                    src={user.image}
                                    alt={user.name || "User"}
                                    width={32}
                                    height={32}
                                    className="rounded-full ring-2 ring-border"
                                />
                            )}
                            <span className="text-sm text-zinc-300">{user.name}</span>
                        </div>

                        {/* Sign Out Button */}
                        <form
                            action={async () => {
                                "use server";
                                await signOut({ redirectTo: "/" });
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
