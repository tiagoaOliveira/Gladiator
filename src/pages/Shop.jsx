import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import './Shop.css';

export default function Shop() {
  const { player, updatePlayer, showNotification, levelUp } = useGame();
  const [purchasing, setPurchasing] = useState(false);

  if (!player) return <p>Carregando...</p>;

  // Cálculo do preço para comprar um nível
  const levelUpPrice = Math.floor(10 * Math.pow(1.2, player.level - 1));

  const items = [
    { id: 1, name: "Poção de Cura", price: 10, effect: "Recupera todo HP", action: () => healPlayer() },
    { id: 2, name: "Comprar Nível", price: levelUpPrice, effect: "+1 Nível, +3 Pontos de Atributo", action: () => buyLevel() }
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
        setPurchasing(false);
        return;
      }

      // Calcular o novo valor de ouro
      const newGold = player.gold - item.price;

      // Para poção de cura, aplicamos o efeito e reduzimos o ouro numa única atualização
      if (item.name === "Poção de Cura") {
        await updatePlayer({
          gold: newGold,
          hp: player.maxHp
        });
        const actualHealing = player.maxHp - player.hp;
        showNotification(`Você recuperou ${actualHealing} pontos de vida!`, 'success');
      }
      // Para compra de nível
      else if (item.name === "Comprar Nível") {
        try {
          // Primeiro, aplicamos manualmente o aumento de nível, pontos de atributo e também o desconto no ouro
          const updatedLevel = player.level + 1;
          const updatedAttributePoints = player.attributePoints + 3; // 3 pontos por nível
          const updatedXpToNextLevel = Math.floor(player.xpToNextLevel * 1.2);

          // Atualizar tudo de uma vez, incluindo a restauração de HP e o desconto no ouro
          await updatePlayer({
            level: updatedLevel,
            attributePoints: updatedAttributePoints,
            xpToNextLevel: updatedXpToNextLevel,
            hp: player.maxHp, // Restaurar HP completo ao subir de nível
            gold: newGold // Aplicar o desconto no ouro
          });

          showNotification(`Você subiu para o nível ${updatedLevel}! Ganhou 3 pontos de atributo.`, 'success');
        } catch (error) {
          console.error('Erro na compra de nível:', error);
          showNotification('Ocorreu um erro ao subir de nível.', 'error');
        }
      }
      // Para qualquer outro item
      else {
        await updatePlayer({ gold: newGold });
        item.action();
      }

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