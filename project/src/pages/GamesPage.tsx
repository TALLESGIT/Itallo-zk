import React, { useEffect } from 'react';

const GamesPage = () => {
  const games = [
    // ... unchanged array ...
  ];

  // Scroll to top sempre que um jogo for aberto
  useEffect(() => {
    if (selectedGame) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedGame]);

  if (!game) return null;

  return (
    // ... existing code ...
  );
};

export default GamesPage; 