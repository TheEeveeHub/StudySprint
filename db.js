const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'data', 'studysprint.sqlite');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
	db.serialize(() => {
		db.run(`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				email TEXT NOT NULL UNIQUE,
				password TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`);

		db.run(`
			CREATE TABLE IF NOT EXISTS tasks (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				title TEXT NOT NULL,
				description TEXT NOT NULL,
				due_date TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);
	});
}

module.exports = {
	db,
	initializeDatabase
};
