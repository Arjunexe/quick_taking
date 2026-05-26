import { auth } from "@/auth";
import { signIn } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowRight, NotebookPen, Sparkles, Shield, Zap, Users } from "lucide-react";

export default async function HomePage() {
    const session = await auth();

    // Check last active mode first
    const cookieStore = await cookies();
    const lastMode = cookieStore.get("last-mode")?.value;
    const ceoCookie = cookieStore.get("ceo-session");

    // If user was last in CEO mode and session is still valid, go there
    if (lastMode === "ceo" && ceoCookie?.value === "authenticated") {
        redirect("/ceo/dashboard");
    }

    // If signed in with Google, go to personal dashboard
    if (session) {
        redirect("/dashboard");
    }

    // If CEO session exists (but no last-mode set), still redirect
    if (ceoCookie?.value === "authenticated") {
        redirect("/ceo/dashboard");
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center">
                {/* Badge */}
                <div className="glass-button mb-8 text-sm text-zinc-300 animate-fade-in">
                    <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Modern note-taking experience
                    </span>
                </div>

                {/* Main Title */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 animate-slide-up">
                    <span className="text-white">Capture Ideas</span>
                    <br />
                    <span className="text-gradient">Instantly</span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mb-10 animate-slide-up delay-100">
                    QuickTaking helps you capture, organize, and find your notes with ease.
                    Beautiful design meets powerful functionality.
                </p>

                {/* Choose Your Space */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl animate-slide-up delay-200">
                    {/* Personal Mode */}
                    <form
                        action={async () => {
                            "use server";
                            await signIn("google", { redirectTo: "/dashboard" });
                        }}
                        className="group"
                    >
                        <button
                            type="submit"
                            className="glass-card w-full text-left hover:scale-[1.03] transition-transform duration-300 cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                                <NotebookPen className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">Personal</h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                Your private notes, signed in with Google.
                            </p>
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                                Sign in with Google
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </form>

                    {/* CEO Mode */}
                    <Link href="/ceo" className="group">
                        <div className="glass-card w-full text-left hover:scale-[1.03] transition-transform duration-300 h-full">
                            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-secondary" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">CEO</h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                Shared workspace, access with a PIN.
                            </p>
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-secondary">
                                Enter PIN
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 w-full max-w-4xl animate-slide-up delay-300">
                    <div className="glass-card text-left">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Easy Capture</h3>
                        <p className="text-sm text-zinc-400">
                            Create notes in seconds with our intuitive interface.
                        </p>
                    </div>

                    <div className="glass-card text-left">
                        <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-secondary" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
                        <p className="text-sm text-zinc-400">
                            Search and find your notes instantly with powerful search.
                        </p>
                    </div>

                    <div className="glass-card text-left">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Secure</h3>
                        <p className="text-sm text-zinc-400">
                            Your notes are private and secure with Google authentication.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
