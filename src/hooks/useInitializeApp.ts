
import { useEffect } from 'react';

export const useInitializeApp = () => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('App initialized - manual agent management only');
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);
};
