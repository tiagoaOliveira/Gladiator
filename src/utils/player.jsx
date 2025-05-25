// Diferentes tipos de personagem disponíveis
export const characterTypes = ['gladiator', 'assassin', 'guardian', 'berserker'];

export function generatePlayerStats(level = 1, characterType = 'gladiator') {
  const safeLevel = Number(level) || 1;

  // Diferentes tipos de personagem com suas especialidades
  switch (characterType) {
    case 'gladiator':
      return {
        hp: Math.floor(150),
        attack: Math.floor(20),
        critChance: parseFloat((15)),
        attackSpeed: parseFloat((1)),
        physicalDefense: Math.floor(30),
        xpToNextLevel: 250 + safeLevel * 50,
        characterType: 'gladiator',
        name: 'Gladiador',
        description: 'Um poderoso gladiador, treinado nas artes do combate. Aprimorando suas habilidades a cada batalha!',
        maxAttackSpeed: 3,
        maxDefenseReduction: 30,
        critMultiplier: 2,
        icon: '⚔️'
      };

    case 'assassin':
      return {
        hp: Math.floor(150),
        attack: Math.floor(20),
        critChance: parseFloat((15)),
        attackSpeed: parseFloat((2)),
        physicalDefense: Math.floor(20),
        xpToNextLevel: 250 + safeLevel * 50,
        characterType: 'assassin',
        name: 'Assassino',
        description: 'Um ninja ágil e mortal, especialista em ataques rápidos e precisos. A velocidade é sua maior arma!',
        maxAttackSpeed: 5, // Velocidade máxima maior
        maxDefenseReduction: 30,
        critMultiplier: 2,
        icon: '🗡️'
      };

    case 'guardian':
      return {
        hp: Math.floor(200),
        attack: Math.floor(15),
        critChance: parseFloat((15)),
        attackSpeed: parseFloat((1)),
        physicalDefense: Math.floor(50),
        xpToNextLevel: 250 + safeLevel * 50,
        characterType: 'guardian',
        name: 'Guardião',
        description: 'Um defensor resiliente, mestre na arte da proteção. Sua defesa é praticamente impenetrável!',
        maxAttackSpeed: 3,
        maxDefenseReduction: 50, // Redução de dano maior
        critMultiplier: 2,
        icon: '🛡️'
      };

    case 'berserker':
      return {
        hp: Math.floor(150),
        attack: Math.floor(30),
        critChance: parseFloat((25)),
        attackSpeed: parseFloat((1)),
        physicalDefense: Math.floor(30),
        xpToNextLevel: 250 + safeLevel * 50,
        characterType: 'berserker',
        name: 'Berserker',
        description: 'Um guerreiro selvagem e implacável. Seus ataques críticos são devastadores!',
        maxAttackSpeed: 3,
        maxDefenseReduction: 30,
        critMultiplier: 3, // Dano crítico maior (3x em vez de 2x)
        icon: '🪓'
      };

    default:
      return {
        hp: Math.floor(150),
        attack: Math.floor(20),
        critChance: parseFloat((15)),
        attackSpeed: parseFloat((1)),
        physicalDefense: Math.floor(30),
        xpToNextLevel: 250 + safeLevel * 50,
        characterType: 'gladiator',
        name: 'Gladiador',
        description: 'Um poderoso gladiador, treinado nas artes do combate.',
        maxAttackSpeed: 3,
        maxDefenseReduction: 30,
        critMultiplier: 2,
        icon: '⚔️'
      };
  }
}