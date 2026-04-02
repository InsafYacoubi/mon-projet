const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root1234",
  database: process.env.DB_NAME || "california_gym",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Parse JSON + formulaire (au cas où)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/** Crée la table si absente (colonnes attendues : nom, email, message). */
async function ensureContactsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      nom VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

app.get("/api/contacts", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM contacts ORDER BY id DESC"
    );
    return res.status(200).json({ success: true, contacts: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la lecture des contacts.",
    });
  }
});

app.post("/api/contact", async (req, res) => {
  const { nom, email, message } = req.body || {};

  if (!nom || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Champs manquants : 'nom', 'email' et 'message' sont requis.",
    });
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
  if (!emailOk) {
    return res.status(400).json({
      success: false,
      message: "L'adresse email semble invalide.",
    });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO contacts (nom, email, message) VALUES (?, ?, ?)",
      [String(nom).trim(), String(email).trim(), String(message).trim()]
    );

    return res.status(200).json({
      success: true,
      message: "Confirmation envoyée : nous avons bien enregistré ta demande.",
      contact: { nom, email, message },
      insertId: result.insertId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du contact.",
    });
  }
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route introuvable." });
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await ensureContactsTable();
  } catch (err) {
    console.error("MySQL (ensureContactsTable):", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`California Gym server listening on http://localhost:${PORT}`);
  });
})();
