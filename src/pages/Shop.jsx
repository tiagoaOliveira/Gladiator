import React from 'react';
import { useGame } from '../context/GameContext';
import './Shop.css';

export default function Shop() {
  const { player, updatePlayer, showNotification } = useGame();
  
  if (!player) return <p>Carregando...</p>;

  const items = [
    { id: 1, name: "Poção de Cura", price: 10, effect: "Recupera 50 HP", action: () => healPlayer(500) },
    { id: 2, name: "Espada de Ferro", price: 100, effect: "+5 de Ataque", action: () => improveAttack(5) },
    { id: 3, name: "Escudo de Madeira", price: 75, effect: "+3 de Defesa", action: () => improveDefense(3) }
  ];

  const healPlayer = (amount) => {
    updatePlayer({ hp: player.hp + amount });
    showNotification(`Você recuperou ${amount} pontos de vida!`, 'success');
  };

  const improveAttack = (amount) => {
    updatePlayer({ attack: player.attack + amount });
    showNotification(`Seu ataque aumentou em ${amount}!`, 'success');
  };

  const improveDefense = (amount) => {
    updatePlayer({ physicalDefense: player.physicalDefense + amount });
    showNotification(`Sua defesa aumentou em ${amount}!`, 'success');
  };

  const buyItem = (item) => {
    if (player.gold < item.price) {
      showNotification("Ouro insuficiente para esta compra!", 'error');
      return;
    }
    
    updatePlayer({ gold: player.gold - item.price });
    item.action();
    showNotification(`Você comprou ${item.name}!`, 'success');
  };

  return (
    <div className="shop-container">
      <h1>Loja</h1>
      <p className="gold-display">🪙 Ouro: {player.gold}</p>
      
      <div className="items-grid">
        {items.map(item => (
          <div key={item.id} className="shop-item">
            <h3>{item.name}</h3>
            <p className="item-effect">{item.effect}</p>
            <p className="item-price">🪙 {item.price}</p>
            <button 
              onClick={() => buyItem(item)} 
              className="buy-button"
              disabled={player.gold < item.price}
            >
              Comprar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}