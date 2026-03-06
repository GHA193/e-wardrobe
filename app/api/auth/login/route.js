import { NextResponse } from "next/server";
import { isSystemInitialized, verifyPassword, createSession } from "@/lib/auth";
import getDb from "@/lib/db";

export async function POST(request) {
    try {
        if (!isSystemInitialized()) {
            return NextResponse.json({ error: "System not initialized" }, { status: 403 });
        }

        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
        }

        const db = getDb();
        const user = db.prepare("SELECT id, password_hash, salt FROM users WHERE username = ?").get(username);

        if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
            return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }

        const { token, expiresAt } = createSession(user.id);

        const response = NextResponse.json({ success: true, username });
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: expiresAt
        });

        return response;
    } catch (error) {
        console.error("POST /api/auth/login error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
