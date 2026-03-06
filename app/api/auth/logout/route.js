import { NextResponse } from "next/server";
import { invalidateSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (token) {
            invalidateSession(token);
        }

        const response = NextResponse.json({ success: true });
        response.cookies.delete("auth_token");

        return response;
    } catch (error) {
        console.error("POST /api/auth/logout error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
