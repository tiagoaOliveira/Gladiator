export function generatePlayerStats(level = 1) {
  const safeLevel = Number(level) || 1;

  return {
    hp: Math.floor(250),
    attack: Math.floor(20),
    critChance: parseFloat((15)),
    attackSpeed: parseFloat((1)),
    //magicPower: Math.floor(5 * Math.pow(1.1, safeLevel - 1)),
    //magicResistance: Math.floor(5 * Math.pow(1.1, safeLevel - 1)),
    physicalDefense: Math.floor(30),
    xpToNextLevel: 250 + safeLevel * 50,
  };
}