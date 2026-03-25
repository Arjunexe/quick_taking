"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CEOPage() {
    const [pin, setPin] = useState(["", "", "", ""]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);
        setError("");

        // Auto-focus next input
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 4 digits entered
        if (value && index === 3 && newPin.every((d) => d !== "")) {
            handleSubmit(newPin.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
        if (pasted.length === 4) {
            const newPin = pasted.split("");
            setPin(newPin);
            handleSubmit(pasted);
        }
    };

    const handleSubmit = async (pinCode: string) => {
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/ceo/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: pinCode }),
            });

            const data = await res.json();

            if (data.success) {
                router.push("/ceo/dashboard");
            } else {
                setError("Wrong PIN. Try again.");
                setPin(["", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch {
            setError("Something went wrong. Try again.");
            setPin(["", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card max-w-sm w-full text-center animate-scale-in">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
                    <KeyRound className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gradient mb-2">CEO Access</h1>
                <p className="text-zinc-400 text-sm mb-8">
                    Enter the 4-digit PIN to continue
                </p>

                {/* PIN Input */}
                <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                    {pin.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            disabled={isLoading}
                            className={`w-14 h-14 text-center text-2xl font-bold glass-input rounded-xl
                                ${error ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : ""}
                                ${isLoading ? "opacity-50" : ""}
                            `}
                        />
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <p className="text-red-400 text-sm mb-4 animate-fade-in">{error}</p>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm mb-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                    </div>
                )}

                {/* Back Link */}
                <div className="pt-4 border-t border-border">
                    <Link
                        href="/signin"
                        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
