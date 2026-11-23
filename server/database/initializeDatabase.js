const db = require("./db");

function initializeDatabase() {
    db.exec(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_id TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, 
            searched_isbn TEXT NOT NULL,
            report_data TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
    );
    `);
   
    console.log("Database Initialized");
}

module.exports = initializeDatabase;