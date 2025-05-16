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

// GET /api/ranking – jogadores ordenados por nível desc
app.get('/api/ranking', (req, res) => {
  db.all(
    `SELECT id, name, level, xp FROM players ORDER BY level DESC, xp DESC LIMIT 50`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});


// Banco SQLite
const dbFile = path.resolve(__dirname, 'tournament.db');
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbFile);

db.serialize(() => {
  // Jogadores - Adicionados mais campos para salvar todos os atributos do jogador
  db.run(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 50,
    hp INTEGER DEFAULT 150,
    maxHp INTEGER DEFAULT 150,
    attack INTEGER DEFAULT 20,
    critChance REAL DEFAULT 10,
    attackSpeed REAL DEFAULT 1.0,
    physicalDefense INTEGER DEFAULT 30,
    magicPower INTEGER DEFAULT 0,
    magicResistance INTEGER DEFAULT 0,
    xpToNextLevel INTEGER DEFAULT 300,
    attributePoints INTEGER DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Login ou criação de jogador
app.post('/api/players/login', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  // Primeiro, verificar se o jogador existe
  db.get(`SELECT * FROM players WHERE name = ?`, [name], (err, player) => {
    if (err) return res.status(500).json({ error: err.message });

    if (player) {
      // Jogador existe - atualizar last_login e retornar dados
      db.run(`UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [player.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(player);
      });
    } else {
      // Jogador não existe - criar novo
      db.run(`
        INSERT INTO players (name) 
        VALUES (?)`,
        [name],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });

          // Buscar o jogador recém-criado para retornar todos os valores default
          db.get(`SELECT * FROM players WHERE id = ?`, [this.lastID], (err, newPlayer) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(newPlayer);
          });
        }
      );
    }
  });
});

// Atualizar jogador
app.put('/api/players/:id', (req, res) => {
  const playerId = req.params.id;
  const playerData = req.body;

  // Excluir campos que não devem ser atualizados diretamente
  const { id, created_at, last_login, ...updateData } = playerData;

  // Construir query dinâmica com os campos a atualizar
  const fields = Object.keys(updateData);
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const placeholders = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => updateData[field]);
  values.push(playerId); // Para o WHERE id = ?

  const query = `UPDATE players SET ${placeholders} WHERE id = ?`;

  db.run(query, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });

    // Retornar o jogador atualizado
    db.get(`SELECT * FROM players WHERE id = ?`, [playerId], (err, player) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(player);
    });
  });
});

// Buscar jogador pelo ID
app.get('/api/players/:id', (req, res) => {
  const playerId = req.params.id;
  db.get(`SELECT * FROM players WHERE id = ?`, [playerId], (err, player) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
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