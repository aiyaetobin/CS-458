const path = require("path");
const Database = require("better-sqlite3");

const databasePath = path.join(__dirname, "booklook.db");
const db = new Database(databasePath);

db.pragma("foreign_keys = ON");

module.exports = db;