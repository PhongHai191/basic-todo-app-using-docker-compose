const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

/* ===============================
   DATABASE POOL
================================= */
const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
});

/* ===============================
   WAIT FOR DATABASE
================================= */
function waitForDatabase() {
  db.query("SELECT 1", (err) => {
    if (err) {
      console.log("Waiting for database...");
      setTimeout(waitForDatabase, 2000);
    } else {
      console.log("Database connected!");

      db.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL
        )
      `, (err) => {
        if (err) console.error("Table creation error:", err);
        else console.log("Todos table ready");
      });
    }
  });
}

waitForDatabase();

/* ===============================
   ROUTES
================================= */

// Get all todos
app.get("/todos", (req, res) => {
  db.query("SELECT * FROM todos", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Add todo
app.post("/todos", (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });

  db.query("INSERT INTO todos (title) VALUES (?)", [title], (err) => {
    if (err) return res.status(500).json(err);
    res.sendStatus(201);
  });
});

// Delete todo
app.delete("/todos/:id", (req, res) => {
  db.query("DELETE FROM todos WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.sendStatus(200);
  });
});

/* ===============================
   START SERVER
================================= */
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});