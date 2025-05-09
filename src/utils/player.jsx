export function generatePlayerStats(level = 1) {
  const safeLevel = Number(level) || 1;

  return {
    hp: Math.floor(100),
    attack: Math.floor(15),
    critChance: parseFloat((10)),
    attackSpeed: parseFloat((1)),
    //magicPower: Math.floor(5 * Math.pow(1.1, safeLevel - 1)),
    //magicResistance: Math.floor(5 * Math.pow(1.1, safeLevel - 1)),
    physicalDefense: Math.floor(15),
    xpToNextLevel: 100 + safeLevel * 50,
  };
}