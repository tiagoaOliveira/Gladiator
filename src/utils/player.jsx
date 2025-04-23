export function generatePlayerStats(level = 1) {
  const safeLevel = Number(level) || 1;

  return {
    hp: Math.floor(100 * Math.pow(1.1, safeLevel - 1)),
    attack: Math.floor(10 * Math.pow(1.1, safeLevel - 1)),
    critChance: parseFloat((5 + safeLevel * 0.2).toFixed(2)),
    attackSpeed: parseFloat((1 + safeLevel * 0.05).toFixed(2)),
    magicPower: Math.floor(5 * Math.pow(1.1, safeLevel - 1)),
    magicResistance: Math.floor(5 * Math.pow(1.1, safeLevel - 1)),
    physicalDefense: Math.floor(10 * Math.pow(1.1, safeLevel - 1)),
    xpToNextLevel: 100 + safeLevel * 50,
  };
}