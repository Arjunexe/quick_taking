import { auth } from "@/auth";
import { signIn } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, NotebookPen, Sparkles, Shield, Zap } from "lucide-react";

export default async function HomePage() {
    const session = await auth();

    if (session) {
        redirect("/dashboard");
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

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 animate-slide-up delay-200">
                    <form
                        action={async () => {
                            "use server";
                            await signIn("google", { redirectTo: "/dashboard" });
                        }}
                    >
                        <button
                            type="submit"
                            className="glass-button bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 text-lg font-medium flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <Link
                        href="/signin"
                        className="glass-button px-8 py-4 text-lg text-zinc-300 hover:text-white transition-colors"
                    >
                        Sign In
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 w-full max-w-4xl animate-slide-up delay-300">
                    <div className="glass-card text-left">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                            <NotebookPen className="w-6 h-6 text-primary" />
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
