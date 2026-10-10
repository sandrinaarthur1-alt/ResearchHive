
const Database = require("better-sqlite3");

// Create or open our database file
const db = new Database("researchhive.db");
db.pragma("foreign_keys = ON");

// Create the projects table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    research_question TEXT,
    category TEXT DEFAULT 'Other',
    status TEXT DEFAULT 'Created',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add category to existing databases that don't have it yet
const columns = db.prepare("PRAGMA table_info(projects)").all();
const hasCategory = columns.some((column) => column.name === "category");

if (!hasCategory) {
  db.exec("ALTER TABLE projects ADD COLUMN category TEXT DEFAULT 'Other'");
}

// Create a table for research papers
db.exec(`
  CREATE TABLE IF NOT EXISTS papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    authors TEXT,
    year INTEGER,
    doi TEXT,
    url TEXT,
    abstract TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )
`);

console.log("ResearchHive database is ready!");

module.exports = db;
