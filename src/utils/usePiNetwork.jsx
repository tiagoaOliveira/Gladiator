import { useEffect } from 'react';

/**
 * Hook para autenticação e pagamento via Pi Network.
 * Em modo de desenvolvimento, faz fallback para simulação.
 */
export default function usePiNetwork() {
  useEffect(() => {
    // Se o Pi SDK estiver disponível, inicializa
    if (window.Pi && typeof window.Pi.init === 'function') {
      window.Pi.init({
        version: '2.0',
        sandbox: true, // false em produção
      });
    }
  }, []);

  /**
   * Autentica o usuário via Pi Network ou simula no dev
   */
  const loginWithPi = async () => {
    // Checa se Pi está disponível
    if (window.Pi && typeof window.Pi.authenticate === 'function') {
      try {
        const scopes = ['username', 'payments'];
        const authResult = await window.Pi.authenticate(scopes);
        console.log('Usuário autenticado (Pi):', authResult);
        return authResult;
      } catch (err) {
        console.error('Erro na autenticação (Pi):', err);
        return null;
      }
    }

    // Modo simulado: retorna usuário fake
    console.warn('Pi Network não disponível - usando modo simulado.');
    return { username: 'test_user', address: 'FAKE_ADDRESS' };
  };

  /**
   * Inicia pagamento via Pi Network ou simula no dev
   */
  const makePayment = async (amount, memo) => {
    if (window.Pi && typeof window.Pi.createPayment === 'function') {
      try {
        const payment = await window.Pi.createPayment({
          amount,
          memo,
          metadata: {},
        });
        console.log('Pagamento Pi real iniciado:', payment);
        return payment;
      } catch (err) {
        console.error('Erro no pagamento (Pi):', err);
        throw err;
      }
    }

    // Modo simulado: aguarda 1s e retorna objeto fake
    console.warn('Pi Network não disponível - simulando pagamento.');
    await new Promise(res => setTimeout(res, 1000));
    const fakePayment = { status: 'SUCCESS', amount, memo, txId: 'FAKE_TX_ID' };
    console.log('Pagamento simulado:', fakePayment);
    return fakePayment;
  };

  return { loginWithPi, makePayment };
}
