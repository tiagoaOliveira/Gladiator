import { useEffect, useState } from 'react';

/**
 * Hook para autenticação e pagamento via Pi Network.
 * Em modo de desenvolvimento, faz fallback para simulação.
 */
export default function usePiNetwork() {
  const [piSDKReady, setPiSDKReady] = useState(false);

  useEffect(() => {
    const initializePi = () => {
      if (window.Pi && typeof window.Pi.init === 'function') {
        try {
          const isProd = import.meta.env.VITE_ENV === 'production';
          window.Pi.init({
            version: '2.0',
            sandbox: !isProd, // sandbox = true em dev; false em produção
          });
          setPiSDKReady(true);
          console.log('Pi SDK inicializado com sucesso');
        } catch (error) {
          console.error('Erro ao inicializar Pi SDK:', error);
          setPiSDKReady(false);
        }
      } else {
        console.warn('Pi SDK não está disponível - modo de desenvolvimento');
        setPiSDKReady(false);
      }
    };

    if (window.Pi) {
      initializePi();
    } else {
      const checkPiSDK = setInterval(() => {
        if (window.Pi) {
          clearInterval(checkPiSDK);
          initializePi();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkPiSDK);
        if (!window.Pi) {
          console.warn('Pi SDK não carregou - continuando em modo de desenvolvimento');
          setPiSDKReady(false);
        }
      }, 5000);
    }
  }, []);

  /**
   * Autentica o usuário via Pi Network ou simula no dev
   */
  const loginWithPi = async () => {
    if (piSDKReady && window.Pi && typeof window.Pi.authenticate === 'function') {
      try {
        const scopes = ['username', 'payments'];
        const authResult = await window.Pi.authenticate(scopes);
        console.log('Usuário autenticado via Pi Network:', authResult);

        if (!authResult || !authResult.user || !authResult.user.username) {
          throw new Error('Dados de autenticação inválidos');
        }

        return {
          username: authResult.user.username,
          uid: authResult.user.uid,
          accessToken: authResult.accessToken,
          scopes: authResult.scopes,
          isAuthenticated: true
        };
      } catch (err) {
        console.error('Erro na autenticação Pi Network:', err);
        throw new Error(`Falha na autenticação: ${err.message}`);
      }
    }

    // Modo simulado
    console.warn('Pi Network não disponível - usando modo simulado para desenvolvimento');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      username: `dev_user_${Date.now()}`,
      uid: 'DEV_UID_123',
      accessToken: 'DEV_ACCESS_TOKEN',
      scopes: ['username', 'payments'],
      isAuthenticated: true,
      isDevelopment: true
    };
  };

  /**
   * Inicia pagamento via Pi Network ou simula no dev
   */
  const makePayment = async (amount, memo, metadata = {}) => {
    if (piSDKReady && window.Pi && typeof window.Pi.createPayment === 'function') {
      try {
        const payment = await window.Pi.createPayment({
          amount: parseFloat(amount),
          memo: memo || 'Pagamento no jogo',
          metadata: {
            ...metadata,
            gameVersion: '1.0',
            timestamp: new Date().toISOString()
          },
        });
        console.log('Pagamento Pi Network iniciado:', payment);
        return payment;
      } catch (err) {
        console.error('Erro no pagamento Pi Network:', err);
        throw new Error(`Falha no pagamento: ${err.message}`);
      }
    }

    // Modo simulado
    console.warn('Pi Network não disponível - simulando pagamento para desenvolvimento');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const fakePayment = {
      identifier: `fake_payment_${Date.now()}`,
      status: {
        developer_approved: true,
        transaction_verified: true,
        developer_completed: true
      },
      amount: parseFloat(amount),
      memo,
      metadata,
      to_address: 'FAKE_GAME_ADDRESS',
      created_at: new Date().toISOString(),
      isDevelopment: true
    };
    console.log('Pagamento simulado para desenvolvimento:', fakePayment);
    return fakePayment;
  };

  /**
   * Verifica se o usuário pode fazer pagamentos
   */
  const canMakePayment = () => {
    return piSDKReady || !window.Pi;
  };

  return {
    loginWithPi,
    makePayment,
    canMakePayment,
    piSDKReady,
    isDevelopment: !piSDKReady && !window.Pi
  };
}
