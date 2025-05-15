// ================= server.js (Backend - Node/Express + SQLite - ESM) =================
// Instalar dependências:
// npm install express sqlite3 cors body-parser
// npm install --save-dev nodemon

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Banco SQLite
const dbFile = path.resolve(__dirname, 'tournament.db');
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbFile);

db.serialize(() => {
  // Jogadores
  db.run(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

  // Torneios
  db.run(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Associação torneio ↔ jogadores
  db.run(`
    CREATE TABLE IF NOT EXISTS tournament_players (
      tournament_id INTEGER,
      player_id INTEGER,
      FOREIGN KEY(tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY(player_id) REFERENCES players(id)
    )
  `);
});

// Endpoints de jogadores
app.get('/api/players', (req, res) => {
  db.all(`SELECT * FROM players`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/players', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.run(`INSERT INTO players (name) VALUES (?)`, [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, level: 1 });
  });
});

// Endpoints de torneio
// Inicia um novo torneio com lista de playerIds
app.post('/api/tournaments', (req, res) => {
  const { playerIds } = req.body;
  if (!Array.isArray(playerIds) || playerIds.length < 2) {
    return res.status(400).json({ error: 'At least two players required' });
  }
  db.run(`INSERT INTO tournaments (state) VALUES (?)`, ['pending'], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const tid = this.lastID;
    const stmt = db.prepare(`INSERT INTO tournament_players (tournament_id, player_id) VALUES (?,?)`);
    playerIds.forEach(pid => stmt.run(tid, pid));
    stmt.finalize();
    res.json({ tournamentId: tid });
  });
});
// Busca jogadores de um torneio
app.get('/api/tournaments/:id/players', (req, res) => {
  const tid = req.params.id;
  db.all(
    `SELECT p.* FROM players p
     JOIN tournament_players tp ON p.id = tp.player_id
     WHERE tp.tournament_id = ?`,
    [tid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`⚔️  Backend ESM rodando em http://localhost:${PORT}`);
});



