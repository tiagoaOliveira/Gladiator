import { useEffect, useState } from 'react';

export default function usePiNetwork() {
  const [piSDKReady, setPiSDKReady] = useState(false);

  useEffect(() => {
    const initializePi = () => {
      if (window.Pi && typeof window.Pi.init === 'function') {
        try {
          const isProd = import.meta.env.VITE_ENV === 'production';
          window.Pi.init({
            version: '2.0',
            sandbox: true,
          });
          setPiSDKReady(true);
        } catch (error) {
          console.error('Erro ao inicializar Pi SDK:', error);
          setPiSDKReady(false);
        }
      } else {
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
          setPiSDKReady(false);
        }
      }, 5000);
    }
  }, []);

  const loginWithPi = async () => {
    if (piSDKReady && window.Pi && typeof window.Pi.authenticate === 'function') {
      try {
        const scopes = ['username', 'payments'];
        const authResult = await window.Pi.authenticate(scopes);

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
        return payment;
      } catch (err) {
        console.error('Erro no pagamento Pi Network:', err);
        throw new Error(`Falha no pagamento: ${err.message}`);
      }
    }

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
    return fakePayment;
  };

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