import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/categories
 * Return the list of available clothing categories from the database.
 */
export async function GET() {
    try {
        const db = getDb();
        const categories = db.prepare("SELECT * FROM categories ORDER BY is_system DESC, value ASC").all();
        return NextResponse.json(categories);
    } catch (error) {
        console.error("GET /api/categories error:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/categories
 * Create a new custom category.
 * Expects a JSON body with: label, icon.
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { label, icon } = body;

        if (!label || !icon) {
            return NextResponse.json(
                { error: "label and icon are required" },
                { status: 400 }
            );
        }

        const db = getDb();
        const id = uuidv4();
        // Generate a unique value based on the id for new custom categories
        const value = `custom_${id}`;

        db.prepare(
            "INSERT INTO categories (id, value, label, icon, is_system) VALUES (?, ?, ?, ?, ?)"
        ).run(id, value, label, icon, 0);

        const newCat = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
        return NextResponse.json(newCat, { status: 201 });
    } catch (error) {
        console.error("POST /api/categories error:", error);
        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}
