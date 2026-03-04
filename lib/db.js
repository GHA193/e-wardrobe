import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Resolve the database file path relative to the project root
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "wardrobe.db");

// Ensure the data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Singleton database connection for the process
let db;

/**
 * Get or create the singleton database connection
 * and ensure the schema is initialized.
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

/**
 * Initialize the database schema if it doesn't exist yet.
 */
function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      image_url TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'uncategorized',
      brand TEXT DEFAULT '',
      purchase_date TEXT DEFAULT '',
      size TEXT DEFAULT '',
      color TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      value TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_system INTEGER DEFAULT 0
    );
  `);

  // Seed default categories if the table is empty
  const count = database.prepare("SELECT COUNT(*) as count FROM categories").get().count;
  if (count === 0) {
    const defaultCategories = [
      { id: "cat_000", value: "uncategorized", label: "未分类", icon: "📦", is_system: 1 },
      { id: "cat_001", value: "tops", label: "上衣", icon: "👕", is_system: 0 },
      { id: "cat_002", value: "bottoms", label: "裤子", icon: "👖", is_system: 0 },
      { id: "cat_003", value: "dresses", label: "裙子", icon: "👗", is_system: 0 },
      { id: "cat_004", value: "outerwear", label: "外套", icon: "🧥", is_system: 0 },
      { id: "cat_005", value: "shoes", label: "鞋子", icon: "👟", is_system: 0 },
      { id: "cat_006", value: "bags", label: "包包", icon: "👜", is_system: 0 },
      { id: "cat_007", value: "accessories", label: "配饰", icon: "⌚", is_system: 0 },
      { id: "cat_008", value: "sportswear", label: "运动装", icon: "🏃", is_system: 0 },
      { id: "cat_009", value: "underwear", label: "内衣", icon: "🩲", is_system: 0 },
      { id: "cat_010", value: "other", label: "其他", icon: "✨", is_system: 0 }
    ];

    const insert = database.prepare(
      "INSERT INTO categories (id, value, label, icon, is_system) VALUES (?, ?, ?, ?, ?)"
    );
    const insertMany = database.transaction((cats) => {
      for (const cat of cats) {
        insert.run(cat.id, cat.value, cat.label, cat.icon, cat.is_system);
      }
    });

    insertMany(defaultCategories);
  }
}

export default getDb;
