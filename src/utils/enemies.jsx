export const enemies = [
  {
    id: 1,
    name: 'Goblin Berserker',
    level: 1,
    hp: 80,
    attack: 8,
    defense: 3,
    critChance: 3,
    attackSpeed: 1,
    image: '/src/assets/images/goblin.jpg',
    rewardXP: 150,
    rewardGoldMultiplier: 1
  },
  {
    id: 2,
    name: 'Ogro Selvagem',
    level: 2,
    hp: 160,           // Dobro do Goblin
    attack: 16,       // Dobro do Goblin
    defense: 6,        // Dobro do Goblin
    critChance: 6,     // Dobro do Goblin
    attackSpeed: 2,    // Dobro do Goblin
    image: '/src/assets/images/ogre.jpg', // Precisará deste arquivo
    rewardXP: 300,      // Dobro da recompensa
    rewardGoldMultiplier: 2 // Dobro da recompensa de ouro
  },
  {
    id: 3,
    name: 'Dragão Ancião',
    level: 4,
    hp: 320,           // 4x o Goblin
    attack: 32,       // 4x o Goblin
    defense: 12,       // 4x o Goblin
    critChance: 12,    // 4x o Goblin
    attackSpeed: 4,    // 4x o Goblin
    image: '/src/assets/images/dragon.jpg', // Precisará deste arquivo
    rewardXP: 600,     // 4x a recompensa
    rewardGoldMultiplier: 4 // 4x a recompensa de ouro
  }
];