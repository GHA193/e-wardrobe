import { NextResponse } from "next/server";
import { isSystemInitialized } from "@/lib/auth";

export async function GET() {
    try {
        const initialized = isSystemInitialized();
        return NextResponse.json({ initialized });
    } catch (error) {
        console.error("GET /api/auth/status error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
