import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    // If not authenticated and trying to access dashboard, redirect to signin
    if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/signin", req.url));
    }
    return NextResponse.next();
});

export const config = {
    matcher: ["/dashboard/:path*"],
};
