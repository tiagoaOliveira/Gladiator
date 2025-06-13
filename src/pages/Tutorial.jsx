import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import './Tutorial.css';

export default function Tutorial() {
  const { player } = useGame();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  if (!player) return <p>Carregando...</p>;

  const tutorialSteps = [
    {
      title: "🎮 Bem-vindo!",
      content: `Olá, ${player.name}! Este é um jogo de RPG onde você batalha contra outros jogadores, completa missões e evolui seu personagem.`
    },
    {
      title: "⚡Poderes ",
      content: "No perfil, escolha um poder especial que define seu estilo de jogo. Cada poder oferece vantagens únicas em combate."
    },
    {
      title: "📊 Atributos",
      content: "Use pontos de atributo para melhorar suas estatísticas: Vida, Ataque, Defesa, Chance Crítica e Velocidade de Ataque."
    },
    {
      title: "⚔️ Arena",
      content: "Na Arena você pode batalhar contra NPCs para ganhar XP, ouro e completar missões. Derrote inimigos para evoluir!"
    },
    {
      title: "🏆 Torneio",
      content: "Participe de torneios contra outros jogadores reais. Ganhe pontos de ranking e prove que é o melhor guerreiro!"
    },
    {
      title: "🏛️ Loja",
      content: "Use seu ouro para comprar itens, poções de cura e melhorias para seu personagem."
    },
    {
      title: "📜 Missões",
      content: "Complete missões diárias para ganhar recompensas extras. Cada missão tem objetivos específicos e prêmios valiosos."
    }
  ];

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="tutorial-container">
      <div className="tutorial-header">
        <h1>📖 Tutorial</h1>
        <p>Aprenda como jogar e domine todas as mecânicas!</p>
        
        <button className="open-tutorial-btn" onClick={openModal}>
          🎓 Abrir Tutorial Completo
        </button>
      </div>

      <div className="tutorial-quick-tips">
        <h2>💡 Dicas Rápidas</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <h3>🎯 Primeiro Passo</h3>
            <p>Vá ao seu Perfil e escolha um poder especial antes de começar a batalhar!</p>
          </div>
          <div className="tip-card">
            <h3>⚡ Estratégia</h3>
            <p>Distribua seus pontos de atributo com sabedoria. Cada build tem suas vantagens!</p>
          </div>
          <div className="tip-card">
            <h3>💰 Recursos</h3>
            <p>Complete missões diárias para maximizar seus ganhos de XP e ouro!</p>
          </div>
        </div>
      </div>

      {/* Modal do Tutorial */}
      {isModalOpen && (
        <div className="modal-overlay-tutorial" onClick={closeModal}>
          <div className="modal-content-tutorial" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-tutorial">
              <h2>{tutorialSteps[currentStep].title}</h2>
              <button className="close-modal-btn" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body-tutorial">
              <p>{tutorialSteps[currentStep].content}</p>
              
              <div className="tutorial-progress">
                <div className="progress-dots">
                  {tutorialSteps.map((_, index) => (
                    <span 
                      key={index}
                      className={`dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                    ></span>
                  ))}
                </div>
                <p className="step-counter">{currentStep + 1} de {tutorialSteps.length}</p>
              </div>
            </div>

            <div className="modal-footer-tutorial">
              <button 
                className="prev-btn" 
                onClick={prevStep} 
                disabled={currentStep === 0}
              >
                ← Anterior
              </button>
              
              {currentStep < tutorialSteps.length - 1 ? (
                <button className="next-btn" onClick={nextStep}>
                  Próximo →
                </button>
              ) : (
                <button className="finish-btn" onClick={closeModal}>
                  🎉 Finalizar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}