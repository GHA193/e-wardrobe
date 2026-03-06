import crypto from "crypto";
import getDb from "./db.js";
import { v4 as uuidv4 } from "uuid";

// Session expires in 7 days
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Validates a password against the 3/4 complexity rule and min length rules.
 * Requires at least 10 chars, and at least 3 of: uppercase, lowercase, numbers, special characters.
 */
export function isStrongPassword(password) {
    if (!password || password.length < 10) return false;

    let typesCount = 0;
    if (/[A-Z]/.test(password)) typesCount++;
    if (/[a-z]/.test(password)) typesCount++;
    if (/[0-9]/.test(password)) typesCount++;
    if (/[^A-Za-z0-9]/.test(password)) typesCount++;

    return typesCount >= 3;
}

/**
 * Hashes a given plaintext password with a unique salt using scrypt.
 */
export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return {
        hash: derivedKey.toString("hex"),
        salt
    };
}

/**
 * Verifies if a given password matches the saved hash and salt.
 */
export function verifyPassword(password, hash, salt) {
    const { hash: newHash } = hashPassword(password, salt);
    return newHash === hash;
}

/**
 * Creates a new user in the database.
 */
export function createUser(username, password) {
    const db = getDb();

    if (!isStrongPassword(password)) {
        throw new Error("Password does not meet complexity requirements.");
    }

    const { hash, salt } = hashPassword(password);
    const userId = "user_" + uuidv4();

    db.prepare(
        "INSERT INTO users (id, username, password_hash, salt) VALUES (?, ?, ?, ?)"
    ).run(userId, username, hash, salt);

    return userId;
}

/**
 * Creates a new session for a given user.
 */
export function createSession(userId) {
    const db = getDb();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + SESSION_DURATION;

    db.prepare(
        "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
    ).run(token, userId, expiresAt);

    return { token, expiresAt: new Date(expiresAt) };
}

/**
 * Validates a session token and returns the corresponding user_id if valid.
 * Also cleans up expired sessions during access as a side-effect.
 */
export function validateSession(token) {
    const db = getDb();

    // Purge expired sessions
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());

    if (!token) return null;

    const session = db.prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?").get(token);

    if (!session || session.expires_at < Date.now()) {
        if (session) {
            db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
        }
        return null;
    }

    return session.user_id;
}

/**
 * Deletes a session based on the token.
 */
export function invalidateSession(token) {
    if (!token) return;
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
}

/**
 * Checks if the system has been initialized (i.e. if there's any user in the db).
 */
export function isSystemInitialized() {
    const db = getDb();
    const count = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
    return count > 0;
}
