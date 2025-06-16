import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import usePiNetwork from '../utils/usePiNetwork';
import NotificationDot from '../components/NotificationDot';
import './Shop.css';
import iconPi from  '../assets/images/iconPi.png'

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
    { id: 1, name: "Heal Potion", price: 10, piPrice: 0.01, effect: "Restore 100% HP", action: () => healPlayer() },
    { id: 2, name: "Buy Level", price: levelUpPrice, piPrice: 0.03, effect: "Level Up", action: () => buyLevel() },
    { id: 3, name: "Premium", price: 100000, piPrice: 0.1, effect: "Unlock Arena Auto Battle", action: () => buyPremium(), isPremium: true }
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

      if (item.name === "Heal Potion") {
        await updatePlayer({ gold: newGold, hp: player.maxHp });
        const actualHealing = player.maxHp - player.hp;
        showNotification(`Você recuperou ${actualHealing} pontos de vida!`, 'success');
      } else if (item.name === "Buy Level") {
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

      showNotification(`You've buy 10 levels! Now you're at ${currentLevel}!`, 'success');
    } catch (err) {
      console.error(err);
      showNotification("Error buy 10 levels", 'error');
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
        showNotification("Fail Authentication Pi.", 'error');
        return;
      }

      // Cria pagamento
      const payment = await makePayment(item.piPrice, `Compra de ${item.name}`);
      console.log("Pagamento Pi simulado:", payment);

      // Aplica o efeito do item após pagamento Pi bem-sucedido
      if (item.name === "Heal Potion") {
        await updatePlayer({ hp: player.maxHp });
        const actualHealing = player.maxHp - player.hp;
        showNotification(`${actualHealing} !`, 'success');
      } else if (item.name === "Buy Level") {
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
        <h1>Shop</h1>
        <p className="gold-display">🪙 Gold: {player.gold}</p>
      </div>

      <div className="items-grid">
        {items.map(item => (
          <div key={item.id} className={`shop-item ${item.isPremium ? 'premium-item' : ''}`}>
            <h3>
              {item.name}
              {item.name === "Heal Potion" && <NotificationDot show={hasLowHealth} />}
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
                  (item.name === "Heal Potion" && player.hp >= player.maxHp) ||
                  (item.name === "Premium" && player.premium)
                }>
                Buy with gold ({item.price} 🪙)
              </button>

              <button
                onClick={() => buyWithPi(item)}
                className="buy-button"
                disabled={
                  purchasing ||
                  (item.name === "Heal Potion" && player.hp >= player.maxHp) ||
                  (item.name === "Premium" && player.premium)
                }
              >
                Buy with Pi ({item.piPrice} <img className='iconPi' src={iconPi} alt="Pi"/>)
              </button>

              {item.name === "Buy Level" && (
                <>
                  <button
                    onClick={buyTenLevelsPi}
                    className="buy-button"
                    disabled={purchasing}
                  >
                    Comprar 10 Níveis (0.25 <img className='iconPi' src={iconPi} alt="Pi" />)
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