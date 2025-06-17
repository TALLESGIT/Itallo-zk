import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Banner {
  image: string;
  link: string;
  alt: string;
}

const banners: Banner[] = [
  {
    image: '/EmBreve.jpeg',
    link: 'https://seusite.com/embreve', // Substitua pelo link real
    alt: 'Banner Em Breve',
  },
  {
    image: '/logoShowDePremios.jpeg',
    link: 'https://seusite.com/showdepremios', // Substitua pelo link real
    alt: 'Banner Show de Prêmios',
  },
  {
    image: '/banner10mil.jpeg', // Altere o nome se necessário
    link: 'https://seusite.com/10mil',
    alt: 'Banner Ação 10 mil reais',
  },
];

const GameBannerAd: React.FC = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        (prevIndex + 1) % banners.length
      );
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(timer);
  }, []);

  const handleBannerClick = () => {
    window.open(banners[currentBannerIndex].link, '_blank');
  };

  return (
    <div className="relative w-full h-full aspect-video cursor-pointer flex items-center justify-center" onClick={handleBannerClick}>
      <AnimatePresence mode="wait">
        <motion.img
          key={currentBannerIndex}
          src={banners[currentBannerIndex].image}
          alt={banners[currentBannerIndex].alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-contain"
        />
      </AnimatePresence>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-4 pointer-events-none">
        <div className="flex space-x-2">
          {banners.map((_, index) => (
            <span
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentBannerIndex ? 'bg-white' : 'bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBannerAd; 