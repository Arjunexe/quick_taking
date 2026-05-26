import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    // If not authenticated and trying to access dashboard, redirect to signin
    if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/signin", req.url));
    }

    // Protect CEO dashboard — check for ceo-session cookie
    if (req.nextUrl.pathname.startsWith("/ceo/dashboard")) {
        const ceoCookie = req.cookies.get("ceo-session");
        if (ceoCookie?.value !== "authenticated") {
            return NextResponse.redirect(new URL("/ceo", req.url));
        }
        // Remember last active mode
        const response = NextResponse.next();
        response.cookies.set("last-mode", "ceo", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
        });
        return response;
    }

    // Personal dashboard — remember mode
    if (req.nextUrl.pathname.startsWith("/dashboard")) {
        const response = NextResponse.next();
        response.cookies.set("last-mode", "personal", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
        });
        return response;
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/dashboard/:path*", "/ceo/dashboard/:path*"],
};
