export function abbreviateNumber(value) {
  const abs = Math.abs(value);
  // Trillions
  if (abs >= 1e12) {
    return (value / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
  }
  // Billions
  if (abs >= 1e9) {
    return (value / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  }
  // Millions
  if (abs >= 1e6) {
    return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  }
  // Thousands
  if (abs >= 1e3) {
    return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  }
  // Menores que mil: retorna o número inteiro
  return value.toString();
}
