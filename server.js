const express = require("express");
const path = require("path");

const app = express();

// Parse JSON + formulaire (au cas où)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/contact", (req, res) => {
  const { nom, email, message } = req.body || {};

  if (!nom || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Champs manquants : 'nom', 'email' et 'message' sont requis.",
    });
  }

  // Validation très légère pour éviter les erreurs de saisie évidentes
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
  if (!emailOk) {
    return res.status(400).json({
      success: false,
      message: "L'adresse email semble invalide.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Confirmation envoyée : nous avons bien reçu ta demande.",
    contact: { nom, email, message },
    timestamp: new Date().toISOString(),
  });
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route introuvable." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`California Gym server listening on http://localhost:${PORT}`);
});

