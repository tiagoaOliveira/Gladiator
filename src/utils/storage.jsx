export function savePlayer(player) {
  localStorage.setItem('player', JSON.stringify(player));
}

export function getPlayer() {
  return JSON.parse(localStorage.getItem('player'));
}
