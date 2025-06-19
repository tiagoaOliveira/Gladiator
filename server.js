import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('DEBUG: JWT_SECRET =', process.env.JWT_SECRET ? '[DEFINIDO]' : '[INDEFINIDO]');

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET não definido em .env – verifique o arquivo .env na raiz do backend.');
}

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: permitir apenas frontend confiável
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
  credentials: true 
}));
app.use(bodyParser.json());

// Middleware de autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.userId = payload.sub; // ID interno do jogador
    next();
  });
}

// Banco SQLite
const dbFile = path.resolve(__dirname, 'tournament.db');
const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbFile);

// Função auxiliar para verificar se uma coluna existe
function columnExists(tableName, columnName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
      if (err) {
        reject(err);
        return;
      }
      const exists = columns.some(col => col.name === columnName);
      resolve(exists);
    });
  });
}

// Função auxiliar para adicionar coluna se não existir
async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
  try {
    const exists = await columnExists(tableName, columnName);
    if (!exists) {
      return new Promise((resolve, reject) => {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, [], (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`Coluna ${columnName} adicionada com sucesso à tabela ${tableName}!`);
            resolve();
          }
        });
      });
    } else {
      console.log(`Coluna ${columnName} já existe na tabela ${tableName}.`);
    }
  } catch (error) {
    console.error(`Erro ao verificar/adicionar coluna ${columnName}:`, error);
  }
}

// Inicialização do banco de dados
db.serialize(async () => {
  // Jogadores - Tabela principal
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      gold INTEGER DEFAULT 50,
      hp INTEGER DEFAULT 250,
      maxHp INTEGER DEFAULT 250,
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

  // Adicionar colunas de poderes se não existirem
  await addColumnIfNotExists('players', 'reflect', 'BOOLEAN DEFAULT 0');
  await addColumnIfNotExists('players', 'criticalX3', 'BOOLEAN DEFAULT 0');
  await addColumnIfNotExists('players', 'speedBoost', 'BOOLEAN DEFAULT 0');
  await addColumnIfNotExists('players', 'piUid', 'TEXT UNIQUE');
  await addColumnIfNotExists('players', 'premium', 'BOOLEAN DEFAULT 0');

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

  console.log('Banco de dados inicializado com sucesso!');
});

// FUNÇÃO AUXILIAR: Validar token Pi Network
async function validatePiNetworkToken(accessToken) {
  try {
    console.log('🔍 Validando token Pi Network...');
    
    // Tentar diferentes endpoints da API Pi Network
    const endpoints = [
      'https://api.minepi.com/v2/me',
      'https://api.minepi.com/v1/me'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Tentando endpoint: ${endpoint}`);
        
        const response = await axios.get(endpoint, {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 segundos timeout
        });
        
        console.log('✅ Resposta da API Pi:', response.data);
        
        if (response.data && response.data.user) {
          return response.data.user;
        } else if (response.data && response.data.uid) {
          // Formato alternativo da resposta
          return {
            uid: response.data.uid,
            username: response.data.username || response.data.name || `Player_${response.data.uid.substring(0, 8)}`
          };
        }
      } catch (endpointError) {
        console.log(`❌ Erro no endpoint ${endpoint}:`, endpointError.message);
        continue;
      }
    }
    
    throw new Error('Nenhum endpoint Pi Network funcionou');
    
  } catch (error) {
    console.error('🚨 Erro na validação Pi Network:', error.message);
    throw error;
  }
}

// Rota de login via Pi Network - CORRIGIDA
app.post('/api/auth/pi-login', async (req, res) => {
  const { accessToken } = req.body;
  
  console.log('🚀 Tentativa de login Pi Network');
  console.log('📝 Access token recebido:', accessToken ? '[PRESENTE]' : '[AUSENTE]');
  
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token é obrigatório' });
  }

  try {
    // Validar token junto à API Pi Network
    const piUser = await validatePiNetworkToken(accessToken);
    
    if (!piUser || !piUser.uid) {
      throw new Error('Resposta inválida da API Pi Network');
    }
    
    const { uid, username } = piUser;
    console.log('👤 Dados do usuário Pi:', { uid, username });

    // Verificar se já existe usuário com esse piUid
    db.get('SELECT * FROM players WHERE piUid = ?', [uid], (err, row) => {
      if (err) {
        console.error('💥 Erro no banco de dados:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (row) {
        console.log('✅ Usuário existente encontrado:', row.name);
        // Atualizar last_login
        db.run('UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [row.id], (uErr) => {
          if (uErr) console.warn('⚠️ Erro ao atualizar last_login:', uErr);
          
          const token = jwt.sign({ sub: row.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
          return res.json({ token });
        });
      } else {
        console.log('🆕 Criando novo usuário:', username);
        // Criar novo jogador vinculado ao Pi
        db.run(
          `INSERT INTO players (name, piUid, created_at, last_login) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [username, uid],
          function (insertErr) {
            if (insertErr) {
              console.error('💥 Erro ao criar usuário:', insertErr);
              return res.status(500).json({ error: insertErr.message });
            }
            
            const newId = this.lastID;
            console.log('✅ Novo usuário criado com ID:', newId);
            
            const token = jwt.sign({ sub: newId }, process.env.JWT_SECRET, { expiresIn: '7d' });
            return res.json({ token });
          }
        );
      }
    });
    
  } catch (error) {
    console.error('🚨 Erro no login Pi Network:', error.message);
    return res.status(401).json({ 
      error: 'Token Pi inválido',
      details: error.message,
      suggestion: 'Verifique se o token Pi Network está válido e não expirado'
    });
  }
});

// Rota para retornar dados do jogador autenticado via JWT
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const playerId = req.userId;
  db.get('SELECT * FROM players WHERE id = ?', [playerId], (err, player) => {
    if (err) {
      return res.status(500).json({ error: 'Erro no banco de dados' });
    }
    if (!player) {
      return res.status(404).json({ error: 'Jogador não encontrado' });
    }
    res.json(player);
  });
});

// Endpoint de teste para desenvolvimento (REMOVER EM PRODUÇÃO)
app.post('/api/auth/test-login', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Endpoint não disponível em produção' });
  }
  
  const { username = 'TestPlayer' } = req.body;
  
  // Buscar ou criar usuário de teste
  db.get('SELECT * FROM players WHERE name = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row) {
      const token = jwt.sign({ sub: row.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token });
    } else {
      db.run(
        `INSERT INTO players (name, created_at, last_login) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [username],
        function (insertErr) {
          if (insertErr) return res.status(500).json({ error: insertErr.message });
          
          const token = jwt.sign({ sub: this.lastID }, process.env.JWT_SECRET, { expiresIn: '7d' });
          return res.json({ token });
        }
      );
    }
  });
});

// Ranking público (pode ficar público)
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

// Endpoints de jogadores: agora protegidos

// Buscar todos os jogadores (restringir a autenticados)
app.get('/api/players', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM players`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Buscar jogador pelo ID (restringir a autenticados)
app.get('/api/players/:id', authenticateToken, (req, res) => {
  const requestedId = Number(req.params.id);
  db.get(`SELECT * FROM players WHERE id = ?`, [requestedId], (err, player) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  });
});

// Atualizar jogador (só próprio)
app.put('/api/players/:id', authenticateToken, (req, res) => {
  const playerId = Number(req.params.id);
  if (req.userId !== playerId) {
    return res.status(403).json({ error: 'Acesso proibido' });
  }
  const playerData = req.body;
  const { id, created_at, last_login, piUid, name, ...updateData } = playerData;
  const fields = Object.keys(updateData);
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  const placeholders = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => updateData[field]);
  values.push(playerId);
  const query = `UPDATE players SET ${placeholders} WHERE id = ?`;
  db.run(query, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Player not found' });
    db.get(`SELECT * FROM players WHERE id = ?`, [playerId], (err, player) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(player);
    });
  });
});

// Buscar missões do jogador (apenas próprio)
app.get('/api/players/:id/missions', authenticateToken, (req, res) => {
  const playerId = Number(req.params.id);
  if (req.userId !== playerId) {
    return res.status(403).json({ error: 'Acesso proibido' });
  }
  db.all(`
    SELECT mission_id, progress, completed, claimed, updated_at 
    FROM player_missions 
    WHERE player_id = ?
  `, [playerId], (err, missions) => {
    if (err) return res.status(500).json({ error: err.message });
    const missionsObject = {};
    missions.forEach(mission => {
      missionsObject[mission.mission_id] = {
        progress: mission.progress,
        completed: mission.completed === 1,
        claimed: mission.claimed === 1,
        updated_at: mission.updated_at
      };
    });
    res.json(missionsObject);
  });
});

// Atualizar progresso de uma missão (apenas próprio)
app.put('/api/players/:playerId/missions/:missionId', authenticateToken, (req, res) => {
  const { playerId, missionId } = req.params;
  if (req.userId !== Number(playerId)) {
    return res.status(403).json({ error: 'Acesso proibido' });
  }
  const { progress, completed, claimed } = req.body;
  db.get(`
    SELECT * FROM player_missions 
    WHERE player_id = ? AND mission_id = ?
  `, [playerId, missionId], (err, existingMission) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existingMission) {
      db.run(`
        UPDATE player_missions 
        SET progress = ?, completed = ?, claimed = ?, updated_at = CURRENT_TIMESTAMP
        WHERE player_id = ? AND mission_id = ?
      `, [progress, completed ? 1 : 0, claimed ? 1 : 0, playerId, missionId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, updated: true });
      });
    } else {
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

// Salvar múltiplas missões de uma vez (batch update) (apenas próprio)
app.put('/api/players/:playerId/missions', authenticateToken, (req, res) => {
  const playerId = Number(req.params.playerId);
  if (req.userId !== playerId) {
    return res.status(403).json({ error: 'Acesso proibido' });
  }
  const missions = req.body;
  if (!missions || typeof missions !== 'object') {
    return res.status(400).json({ error: 'Invalid missions data' });
  }
  const upsertPromises = Object.entries(missions).map(([missionId, missionData]) => {
    return new Promise((resolve, reject) => {
      const { progress, completed, claimed } = missionData;
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
  Promise.all(upsertPromises)
    .then(() => {
      res.json({ success: true, message: 'Missions updated successfully' });
    })
    .catch(err => {
      console.error('Error updating missions:', err);
      res.status(500).json({ error: 'Failed to update missions' });
    });
});

// Obter um adversário próximo no ranking (restringir a autenticados)
app.get('/api/tournament/opponent/:playerId', authenticateToken, (req, res) => {
  const playerId = Number(req.params.playerId);
  if (req.userId !== playerId) {
    return res.status(403).json({ error: 'Acesso proibido' });
  }
  db.get(`SELECT rankedPoints FROM players WHERE id = ?`, [playerId], (err, player) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    db.all(`
      SELECT * FROM players 
      WHERE id != ? 
      ORDER BY ABS(rankedPoints - ?) ASC
      LIMIT 13
    `, [playerId, player.rankedPoints], (err, opponents) => {
      if (err) return res.status(500).json({ error: err.message });
      if (opponents.length === 0) {
        db.all(`SELECT * FROM players WHERE id != ? LIMIT 20`, [playerId], (err, randomOpponents) => {
          if (err) return res.status(500).json({ error: err.message });
          if (randomOpponents.length === 0) {
            return res.status(404).json({ error: 'No opponents available' });
          }
          const randomIndex = Math.floor(Math.random() * randomOpponents.length);
          res.json(randomOpponents[randomIndex]);
        });
      } else {
        const randomIndex = Math.floor(Math.random() * opponents.length);
        res.json(opponents[randomIndex]);
      }
    });
  });
});

// Registrar batalha de torneio (restringir a autenticados)
app.post('/api/tournament/battle', authenticateToken, (req, res) => {
  const { player1Id, player2Id, winnerId, battleLog } = req.body;
  if (!player1Id || !player2Id) {
    return res.status(400).json({ error: 'Player IDs are required' });
  }
  db.run(`
    INSERT INTO tournament_battles (player1_id, player2_id, winner_id, battle_log)
    VALUES (?, ?, ?, ?)
  `, [player1Id, player2Id, winnerId, JSON.stringify(battleLog)], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (winnerId) {
      db.run(`
        UPDATE players SET rankedPoints = rankedPoints + 30
        WHERE id = ?
      `, [winnerId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
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
      res.json({
        success: true,
        battleId: this.lastID,
        message: "Batalha empatada, nenhum ponto foi alterado."
      });
    }
  });
});

// Endpoints de torneio: criação e listagem (restringir a autenticados)
app.post('/api/tournaments', authenticateToken, (req, res) => {
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

app.get('/api/tournaments/:id/players', authenticateToken, (req, res) => {
  const tid = Number(req.params.id);
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
  console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
  console.log(`🌐 CORS permitido para: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});