import { NextResponse } from "next/server";
import { isSystemInitialized, createUser, createSession } from "@/lib/auth";

export async function POST(request) {
    try {
        if (isSystemInitialized()) {
            return NextResponse.json({ error: "System already initialized" }, { status: 403 });
        }

        const body = await request.json();
        const { username, password, confirmPassword } = body;

        if (!username || !password || !confirmPassword) {
            return NextResponse.json({ error: "Username and password fields are required" }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
        }

        const userId = createUser(username, password);
        const { token, expiresAt } = createSession(userId);

        const response = NextResponse.json({ success: true }, { status: 201 });
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: expiresAt
        });

        return response;
    } catch (error) {
        console.error("POST /api/auth/setup error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
