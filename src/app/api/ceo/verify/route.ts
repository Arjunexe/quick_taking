import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const { pin } = await req.json();

        if (!pin || pin !== process.env.CEO_PIN) {
            return NextResponse.json(
                { success: false, error: "Invalid PIN" },
                { status: 401 }
            );
        }

        const cookieStore = await cookies();
        cookieStore.set("ceo-session", "authenticated", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { success: false, error: "Something went wrong" },
            { status: 500 }
        );
    }
}
