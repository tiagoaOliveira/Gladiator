import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import usePiNetwork from '../utils/usePiNetwork';
import './Shop.css';

export default function Shop() {
  const { player, updatePlayer, showNotification, levelUp } = useGame();
  const [purchasing, setPurchasing] = useState(false);

  // Extrai as funções do hook para autenticação e pagamento Pi
  const { loginWithPi, makePayment } = usePiNetwork();

  if (!player) return <p>Carregando...</p>;

  // Cálculo do preço para comprar um nível
  const levelUpPrice = Math.floor(10 * Math.pow(1.2, player.level - 1));

  const items = [
    { id: 1, name: "Poção de Cura", price: 10, effect: "Recupera todo HP", action: () => healPlayer() },
    { id: 2, name: "Comprar Nível", price: levelUpPrice, effect: "+1 Nível, +3 Pontos de Atributo", action: () => buyLevel() }
  ];

  function healPlayer() {
    const newHp = player.maxHp;
    const actualHealing = newHp - player.hp;

    updatePlayer({ hp: newHp });
    showNotification(`Você recuperou ${actualHealing} pontos de vida!`, 'success');
  }

  function buyLevel() {
    levelUp();
    showNotification(`Você subiu para o nível ${player.level + 1}!`, 'success');
  }

  async function buyItem(item) {
    if (purchasing) return;
    setPurchasing(true);

    try {
      if (player.gold < item.price) {
        showNotification("Ouro insuficiente para esta compra!", 'error');
        return;
      }

      // Fluxo de compra via ouro
      const newGold = player.gold - item.price;

      if (item.name === "Poção de Cura") {
        await updatePlayer({ gold: newGold, hp: player.maxHp });
        const actualHealing = player.maxHp - player.hp;
        showNotification(`Você recuperou ${actualHealing} pontos de vida!`, 'success');
      } else if (item.name === "Comprar Nível") {
        const updatedLevel = player.level + 1;
        const updatedAttributePoints = player.attributePoints + 3;
        const updatedXpToNextLevel = Math.floor(player.xpToNextLevel * 1.2);

        await updatePlayer({
          level: updatedLevel,
          attributePoints: updatedAttributePoints,
          xpToNextLevel: updatedXpToNextLevel,
          hp: player.maxHp,
          gold: newGold
        });

        showNotification(`Você subiu para o nível ${updatedLevel}! Ganhou 3 pontos de atributo.`, 'success');
      } else {
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
  }

  // Função de compra via Pi Network
  async function buyWithPi(item) {
    if (purchasing) return;
    setPurchasing(true);

    try {
      // Garante autenticação
      const user = await loginWithPi();
      if (!user) {
        showNotification("Falha na autenticação Pi.", 'error');
        return;
      }

      // Cria pagamento
      const payment = await makePayment(item.price, `Compra de ${item.name}`);
      console.log("Pagamento Pi simulado:", payment);
      showNotification(`Pagamento Pi para ${item.name} processado com sucesso!`, 'success');
    } catch (err) {
      console.error("Erro no pagamento Pi:", err);
      showNotification("Erro ao processar pagamento Pi.", 'error');
    } finally {
      setPurchasing(false);
    }
  }

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
              {purchasing ? 'Comprando...' : 'Comprar com Ouro'}
            </button>

            <button
              onClick={() => buyWithPi(item)}
              className="buy-button"
              disabled={purchasing}
            >
              {purchasing ? 'Processando...' : 'Comprar com Pi'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
