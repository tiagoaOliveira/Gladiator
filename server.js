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
  // Jogadores - Adicionado o campo rankedPoints
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
    critChance REAL DEFAULT 15,
    attackSpeed REAL DEFAULT 1.0,
    physicalDefense INTEGER DEFAULT 30,
    magicPower INTEGER DEFAULT 0,
    magicResistance INTEGER DEFAULT 0,
    xpToNextLevel INTEGER DEFAULT 300,
    attributePoints INTEGER DEFAULT 3,
    rankedPoints INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
  // Verificar e adicionar colunas dos poderes se não existirem
  db.all(`PRAGMA table_info(players)`, [], (err, columns) => {
    if (err) {
      console.error('Erro ao verificar colunas:', err);
      return;
    }

    const columnNames = columns.map(col => col.name);

    if (!columnNames.includes('reflect')) {
      db.run(`ALTER TABLE players ADD COLUMN reflect BOOLEAN DEFAULT 0`);
    }
    if (!columnNames.includes('criticalX3')) {
      db.run(`ALTER TABLE players ADD COLUMN criticalX3 BOOLEAN DEFAULT 0`);
    }
    if (!columnNames.includes('speedBoost')) {
      db.run(`ALTER TABLE players ADD COLUMN speedBoost BOOLEAN DEFAULT 0`);
    }
  });
  // Adicionar coluna rankedPoints se ela não existir
  db.run(`
    PRAGMA table_info(players)
  `, [], (err, rows) => {
    if (err) {
      console.error('Erro ao verificar colunas da tabela:', err);
      return;
    }

    // Verificar se a coluna rankedPoints já existe
    db.get(`PRAGMA table_info(players)`, [], (err, rows) => {
      if (err) {
        console.error('Erro ao verificar colunas:', err);
        return;
      }

      const columns = Array.isArray(rows) ? rows : [];
      const hasRankedPoints = columns.some(col => col.name === 'rankedPoints');

      if (!hasRankedPoints) {
        console.log('Adicionando coluna rankedPoints à tabela players...');
        db.run(`ALTER TABLE players ADD COLUMN rankedPoints INTEGER DEFAULT 0`, [], (err) => {
          if (err) {
            console.error('Erro ao adicionar coluna rankedPoints:', err);
          } else {
            console.log('Coluna rankedPoints adicionada com sucesso!');
          }
        });
      }
    });
  });

  // Tabela de missões do jogador
  db.run(`
    CREATE TABLE IF NOT EXISTS player_missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      mission_id INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      claimed BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(player_id) REFERENCES players(id),
      UNIQUE(player_id, mission_id)
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

  // Histórico de batalhas de torneio
  db.run(`
    CREATE TABLE IF NOT EXISTS tournament_battles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER NOT NULL,
      winner_id INTEGER,
      points_gained INTEGER DEFAULT 30,
      points_lost INTEGER DEFAULT 10,
      battle_log TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(player1_id) REFERENCES players(id),
      FOREIGN KEY(player2_id) REFERENCES players(id),
      FOREIGN KEY(winner_id) REFERENCES players(id)
    )
  `);
});

// Modificar para ordenar por pontos de ranking, não por nível
app.get('/api/ranking', (req, res) => {
  db.all(
    `SELECT id, name, level, xp, rankedPoints FROM players ORDER BY rankedPoints DESC, level DESC LIMIT 50`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
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

// Buscar missões do jogador
app.get('/api/players/:id/missions', (req, res) => {
  const playerId = req.params.id;

  db.all(`
    SELECT mission_id, progress, completed, claimed, updated_at 
    FROM player_missions 
    WHERE player_id = ?
  `, [playerId], (err, missions) => {
    if (err) return res.status(500).json({ error: err.message });

    // Converter array para formato de objeto que o frontend espera
    const missionsObject = {};
    missions.forEach(mission => {
      missionsObject[mission.mission_id] = {
        progress: mission.progress,
        completed: mission.completed === 1, // SQLite retorna 1/0 para boolean
        claimed: mission.claimed === 1,
        updated_at: mission.updated_at
      };
    });

    res.json(missionsObject);
  });
});

// Atualizar progresso de uma missão
app.put('/api/players/:playerId/missions/:missionId', (req, res) => {
  const { playerId, missionId } = req.params;
  const { progress, completed, claimed } = req.body;

  // Verificar se a missão já existe para o jogador
  db.get(`
    SELECT * FROM player_missions 
    WHERE player_id = ? AND mission_id = ?
  `, [playerId, missionId], (err, existingMission) => {
    if (err) return res.status(500).json({ error: err.message });

    if (existingMission) {
      // Atualizar missão existente
      db.run(`
        UPDATE player_missions 
        SET progress = ?, completed = ?, claimed = ?, updated_at = CURRENT_TIMESTAMP
        WHERE player_id = ? AND mission_id = ?
      `, [progress, completed ? 1 : 0, claimed ? 1 : 0, playerId, missionId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, updated: true });
      });
    } else {
      // Criar nova entrada de missão
      db.run(`
        INSERT INTO player_missions (player_id, mission_id, progress, completed, claimed)
        VALUES (?, ?, ?, ?, ?)
      `, [playerId, missionId, progress, completed ? 1 : 0, claimed ? 1 : 0], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, created: true });
      });
    }
  });
});

// Salvar múltiplas missões de uma vez (batch update)
app.put('/api/players/:playerId/missions', (req, res) => {
  const playerId = req.params.playerId;
  const missions = req.body; // Objeto com as missões no formato { missionId: { progress, completed, claimed } }

  if (!missions || typeof missions !== 'object') {
    return res.status(400).json({ error: 'Invalid missions data' });
  }

  // Preparar as queries para inserção/atualização
  const upsertPromises = Object.entries(missions).map(([missionId, missionData]) => {
    return new Promise((resolve, reject) => {
      const { progress, completed, claimed } = missionData;

      // Usar INSERT OR REPLACE para upsert
      db.run(`
        INSERT OR REPLACE INTO player_missions 
        (player_id, mission_id, progress, completed, claimed, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [playerId, missionId, progress, completed ? 1 : 0, claimed ? 1 : 0], function (err) {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  // Executar todas as queries
  Promise.all(upsertPromises)
    .then(() => {
      res.json({ success: true, message: 'Missions updated successfully' });
    })
    .catch(err => {
      console.error('Error updating missions:', err);
      res.status(500).json({ error: 'Failed to update missions' });
    });
});

// Obter um adversário próximo no ranking
app.get('/api/tournament/opponent/:playerId', (req, res) => {
  const playerId = req.params.playerId;

  db.get(`SELECT rankedPoints FROM players WHERE id = ?`, [playerId], (err, player) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    // Encontrar jogadores com pontuação próxima (até 13 posições abaixo)
    db.all(`
      SELECT * FROM players 
      WHERE id != ? 
      ORDER BY ABS(rankedPoints - ?) ASC
      LIMIT 13
    `, [playerId, player.rankedPoints], (err, opponents) => {
      if (err) return res.status(500).json({ error: err.message });

      if (opponents.length === 0) {
        // Se não encontrar oponentes próximos, selecionar qualquer oponente aleatório
        db.all(`SELECT * FROM players WHERE id != ? LIMIT 20`, [playerId], (err, randomOpponents) => {
          if (err) return res.status(500).json({ error: err.message });
          if (randomOpponents.length === 0) {
            return res.status(404).json({ error: 'No opponents available' });
          }

          // Selecionar oponente aleatório
          const randomIndex = Math.floor(Math.random() * randomOpponents.length);
          res.json(randomOpponents[randomIndex]);
        });
      } else {
        // Selecionar um oponente aleatório entre os encontrados
        const randomIndex = Math.floor(Math.random() * opponents.length);
        res.json(opponents[randomIndex]);
      }
    });
  });
});

// Registrar batalha de torneio
app.post('/api/tournament/battle', (req, res) => {
  const { player1Id, player2Id, winnerId, battleLog } = req.body;

  if (!player1Id || !player2Id) {
    return res.status(400).json({ error: 'Player IDs are required' });
  }

  // Adicionar o registro da batalha
  db.run(`
    INSERT INTO tournament_battles (player1_id, player2_id, winner_id, battle_log)
    VALUES (?, ?, ?, ?)
  `, [player1Id, player2Id, winnerId, JSON.stringify(battleLog)], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // Atualizar pontuação dos jogadores
    if (winnerId) {
      // Winner ganha 30 pontos
      db.run(`
        UPDATE players SET rankedPoints = rankedPoints + 30
        WHERE id = ?
      `, [winnerId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Loser perde 10 pontos (mas não fica negativo)
        const loserId = winnerId === player1Id ? player2Id : player1Id;
        db.run(`
          UPDATE players SET rankedPoints = MAX(0, rankedPoints - 10)
          WHERE id = ?
        `, [loserId], (err) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            success: true,
            battleId: this.lastID,
            message: `Batalha registrada. ${winnerId} ganhou 30 pontos, ${loserId} perdeu 10 pontos.`
          });
        });
      });
    } else {
      // Empate, ninguém ganha ou perde pontos
      res.json({
        success: true,
        battleId: this.lastID,
        message: "Batalha empatada, nenhum ponto foi alterado."
      });
    }
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