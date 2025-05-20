import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import './Shop.css';

export default function Shop() {
  const { player, updatePlayer, showNotification, levelUp } = useGame();
  const [purchasing, setPurchasing] = useState(false);

  if (!player) return <p>Carregando...</p>;

  // Cálculo do preço para comprar um nível
  const levelUpPrice = Math.floor(1 * Math.pow(1.2, player.level - 1));

  const items = [
    { id: 1, name: "Poção de Cura", price: 10, effect: "Recupera 50 HP", action: () => healPlayer(50) },
    { id: 2, name: "Espada de Ferro", price: 100, effect: "+5 de Ataque", action: () => improveAttack(5) },
    { id: 3, name: "Escudo de Madeira", price: 75, effect: "+3 de Defesa", action: () => improveDefense(3) },
    { id: 4, name: "Comprar Nível", price: levelUpPrice, effect: "+1 Nível, +3 Pontos de Atributo", action: () => buyLevel() }
  ];

  const healPlayer = (amount) => {
    const newHp = player.maxHp;
    const actualHealing = newHp - player.hp;

    updatePlayer({ hp: newHp });
    showNotification(`Você recuperou ${actualHealing} pontos de vida!`, 'success');
  };

  const improveAttack = (amount) => {
    updatePlayer({ attack: player.attack + amount });
    showNotification(`Seu ataque aumentou em ${amount}!`, 'success');
  };

  const improveDefense = (amount) => {
    updatePlayer({ physicalDefense: player.physicalDefense + amount });
    showNotification(`Sua defesa aumentou em ${amount}!`, 'success');
  };

  const buyLevel = () => {
    // Utilizamos a função levelUp do GameContext
    levelUp();
    showNotification(`Você subiu para o nível ${player.level + 1}!`, 'success');
  };

  const buyItem = async (item) => {
    // Evitar compras múltiplas enquanto uma está processando
    if (purchasing) return;
    setPurchasing(true);

    try {
      // Verificar se há ouro suficiente
      if (player.gold < item.price) {
        showNotification("Ouro insuficiente para esta compra!", 'error');
        setPurchasing(false);
        return;
      }

      // Verificar se é uma poção de cura e o HP já está no máximo
      if (item.name === "Poção de Cura" && player.hp >= player.maxHp) {
        showNotification("Sua vida já está no máximo!", 'error');
        return;
      }

      // Primeiro reduzir o ouro no contexto (e no servidor)  
      const newGold = player.gold - item.price;
      await updatePlayer({ gold: newGold });

      // Depois aplicar o efeito do item
      item.action();

      showNotification(`Você comprou ${item.name}!`, 'success');
    } catch (err) {
    console.error(err);
    showNotification("Erro ao completar a compra", 'error');
  } finally {
    setPurchasing(false);
  }
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
              disabled={
                purchasing ||
                player.gold < item.price ||
                (item.name === "Poção de Cura" && player.hp >= player.maxHp)
              }
            >
              {purchasing ? 'Comprando...' : 'Comprar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}