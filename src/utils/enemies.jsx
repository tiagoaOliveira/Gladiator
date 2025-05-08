import goblin from '../assets/images/goblin.png'
import orc from '../assets/images/orc1.png'
import dragao from '../assets/images/dragao1.png'

export const enemies = [
  {
    id: 1,
    name: 'Goblin Berserker',
    level: 1,
    hp: 80,
    attack: 16,
    defense: 3,
    critChance: 3,
    attackSpeed: 1,
    image: goblin,
    rewardXP: 150,
    rewardGoldMultiplier: 1
  },
  {
    id: 2,
    name: 'Orc Selvagem',
    level: 2,
    hp: 160,           // Dobro do Goblin
    attack: 32,       // Dobro do Goblin
    defense: 6,        // Dobro do Goblin
    critChance: 6,     // Dobro do Goblin
    attackSpeed: 1.5,    // Dobro do Goblin
    image: orc, // Precisará deste arquivo
    rewardXP: 300,      // Dobro da recompensa
    rewardGoldMultiplier: 2 // Dobro da recompensa de ouro
  },
  {
    id: 3,
    name: 'Dragão Ancião',
    level: 4,
    hp: 320,           // 4x o Goblin
    attack: 64,       // 4x o Goblin
    defense: 12,       // 4x o Goblin
    critChance: 12,    // 4x o Goblin
    attackSpeed: 2,    // 4x o Goblin
    image: dragao, // Precisará deste arquivo
    rewardXP: 600,     // 4x a recompensa
    rewardGoldMultiplier: 4 // 4x a recompensa de ouro
  }
];