import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { Configuration } from "./utils";

let db: Database;

export async function getDB(): Promise<Database> {
	if (!db) {
		console.error("Database has not been initialized");
		process.exit(1);
	}
	return db;
}

export async function initDB(config: Configuration) {
	if (db) return;
	db = await open({
		driver: sqlite3.cached.Database,
		filename: config.dbPath,
	});
	await db.migrate();
}
