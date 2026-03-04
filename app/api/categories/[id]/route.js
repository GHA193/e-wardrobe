import { NextResponse } from "next/server";
import getDb from "@/lib/db";

/**
 * PUT /api/categories/[id]
 * Update a category label and icon. System categories cannot be updated.
 */
export async function PUT(request, props) {
    try {
        const params = await props.params;
        const id = params.id;
        const body = await request.json();
        const { label, icon } = body;

        if (!label || !icon) {
            return NextResponse.json(
                { error: "label and icon are required" },
                { status: 400 }
            );
        }

        const db = getDb();

        const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        if (category.is_system) {
            return NextResponse.json(
                { error: "System categories cannot be edited" },
                { status: 403 }
            );
        }

        db.prepare(
            "UPDATE categories SET label = ?, icon = ? WHERE id = ?"
        ).run(label, icon, id);

        const updatedCat = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
        return NextResponse.json(updatedCat);
    } catch (error) {
        console.error(`PUT /api/categories error:`, error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/categories/[id]
 * Delete a category. System categories cannot be deleted.
 * When a category is deleted, items using it are reassigned to 'uncategorized'.
 */
export async function DELETE(request, props) {
    try {
        const params = await props.params;
        const id = params.id;
        const db = getDb();

        const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        if (category.is_system) {
            return NextResponse.json(
                { error: "System categories cannot be deleted" },
                { status: 403 }
            );
        }

        // Run delete and item reassign in a transaction
        const deleteTransaction = db.transaction(() => {
            // Reassign items to uncategorized
            db.prepare(
                "UPDATE items SET category = 'uncategorized' WHERE category = ?"
            ).run(category.value);

            // Delete the category
            db.prepare("DELETE FROM categories WHERE id = ?").run(id);
        });

        deleteTransaction();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`DELETE /api/categories/${params.id} error:`, error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}
