import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import usePiNetwork from '../utils/usePiNetwork';
import NotificationDot from '../components/NotificationDot';
import './Shop.css';

export default function Shop() {
  const { player, updatePlayer, showNotification, levelUp } = useGame();
  const [purchasing, setPurchasing] = useState(false);
  const hasLowHealth = player.hp < (player.maxHp * 0.33);

  // Extrai as funções do hook para autenticação e pagamento Pi
  const { loginWithPi, makePayment } = usePiNetwork();

  if (!player) return <p>Carregando...</p>;

  // Cálculo do preço para comprar um nível
  const levelUpPrice = Math.floor(50 * Math.pow(1.2, player.level - 1));
  const tenLevelsPrice = Array.from({ length: 10 }).reduce((acc, _, i) => {
    const level = player.level + i;
    return acc + Math.floor(50 * Math.pow(1.2, level - 1));
  }, 0);

  const items = [
    { id: 1, name: "Poção de Cura", price: 10, piPrice: 0.01, effect: "Recupera todo HP", action: () => healPlayer() },
    { id: 2, name: "Comprar Nível", price: levelUpPrice, piPrice: 0.03, effect: "+1 Nível", action: () => buyLevel() },
    { id: 3, name: "Premium", price: 100, piPrice: 0.1, effect: "Libera o modo automático da arena", action: () => buyPremium(), isPremium: true }
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

  function buyPremium() {
    updatePlayer({ premium: true });
    showNotification("Premium ativado! Modo automático liberado na arena!", 'success');
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

  async function buyTenLevelsGold() {
    if (purchasing) return;
    setPurchasing(true);

    try {
      if (player.gold < tenLevelsPrice) {
        showNotification("Ouro insuficiente para comprar 10 níveis!", 'error');
        return;
      }

      const newGold = player.gold - tenLevelsPrice;
      let currentLevel = player.level;
      let currentAttributePoints = player.attributePoints;
      let currentXpToNextLevel = player.xpToNextLevel;

      for (let i = 0; i < 10; i++) {
        currentLevel++;
        currentAttributePoints += 3;
        currentXpToNextLevel = Math.floor(currentXpToNextLevel * 1.2);
      }

      await updatePlayer({
        gold: newGold,
        level: currentLevel,
        attributePoints: currentAttributePoints,
        xpToNextLevel: currentXpToNextLevel,
        hp: player.maxHp,
      });

      showNotification(`Você comprou 10 níveis! Agora está no nível ${currentLevel}!`, 'success');
    } catch (err) {
      console.error(err);
      showNotification("Erro ao comprar 10 níveis com ouro", 'error');
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
      const payment = await makePayment(item.piPrice, `Compra de ${item.name}`);
      console.log("Pagamento Pi simulado:", payment);

      // Aplica o efeito do item após pagamento Pi bem-sucedido
      if (item.name === "Poção de Cura") {
        await updatePlayer({ hp: player.maxHp });
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
        });
        showNotification(`Você subiu para o nível ${updatedLevel}! Ganhou 3 pontos de atributo.`, 'success');
      } else {
        item.action(); // Para premium, etc.
      }

      showNotification(`Pagamento Pi para ${item.name} processado com sucesso!`, 'success');
    } catch (err) {
      console.error("Erro no pagamento Pi:", err);
      showNotification("Erro ao processar pagamento Pi.", 'error');
    } finally {
      setPurchasing(false);
    }
  }

  async function buyTenLevelsPi() {
    if (purchasing) return;
    setPurchasing(true);

    try {
      const user = await loginWithPi();
      if (!user) {
        showNotification("Falha na autenticação Pi.", 'error');
        return;
      }

      const payment = await makePayment(0.25, `Compra de 10 Níveis`); // Preço Pi para 10 níveis
      console.log("Pagamento Pi de 10 Níveis simulado:", payment);

      let currentLevel = player.level;
      let currentAttributePoints = player.attributePoints;
      let currentXpToNextLevel = player.xpToNextLevel;

      for (let i = 0; i < 10; i++) {
        currentLevel++;
        currentAttributePoints += 3;
        currentXpToNextLevel = Math.floor(currentXpToNextLevel * 1.2);
      }

      await updatePlayer({
        level: currentLevel,
        attributePoints: currentAttributePoints,
        xpToNextLevel: currentXpToNextLevel,
        hp: player.maxHp,
      });

      showNotification(`Pagamento Pi para 10 Níveis processado com sucesso!`, 'success');
    } catch (err) {
      console.error("Erro no pagamento Pi de 10 Níveis:", err);
      showNotification("Erro ao processar pagamento Pi para 10 Níveis.", 'error');
    } finally {
      setPurchasing(false);
    }
  }


  return (
    <div className="shop-container">
      <div className='shop-header'>
        <h1>Loja</h1>
        <p className="gold-display">🪙 Ouro: {player.gold} pi</p>
      </div>

      <div className="items-grid">
        {items.map(item => (
          <div key={item.id} className={`shop-item ${item.isPremium ? 'premium-item' : ''}`}>
            <h3>
              {item.name}
              {item.name === "Poção de Cura" && <NotificationDot show={hasLowHealth} />}
            </h3>
            <p className="item-effect">{item.effect}</p>
            {/* O preço em ouro do item principal já é exibido aqui */}
            {/* <p className="item-price">🪙 {item.price}</p> */}

            <div className='buy-button-container'>
              <button
                onClick={() => buyItem(item)}
                className="buy-button"
                disabled={
                  purchasing ||
                  player.gold < item.price ||
                  (item.name === "Poção de Cura" && player.hp >= player.maxHp) ||
                  (item.name === "Premium" && player.premium)
                }>
                Comprar com Ouro ({item.price} 🪙)
              </button>

              <button
                onClick={() => buyWithPi(item)}
                className="buy-button"
                disabled={
                  purchasing ||
                  (item.name === "Premium" && player.premium)
                }
              >
                Comprar com Pi ({item.piPrice} <img src="/assets/iconpi.png" alt=""/>)
              </button>

              {item.name === "Comprar Nível" && (
                <>
                  <button
                    onClick={buyTenLevelsPi}
                    className="buy-button"
                    disabled={purchasing}
                  >
                    Comprar 10 Níveis (0.25 <img src="/assets/iconpi.png" alt="" />)
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}