import { motion } from 'framer-motion';
import React from 'react';

interface BannerProps {
  url: string;
  imageUrl?: string;
}

const Banner: React.FC<BannerProps> = ({ url, imageUrl }) => {
  // Fallback para erro de carregamento
  const [imgError, setImgError] = React.useState(false);
  const srcToUse = !imgError
    ? (imageUrl || '/banner.jpeg')
    : undefined;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full block rounded-xl overflow-hidden shadow-lg mb-8 relative border border-white/20"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="relative h-[220px] md:h-[320px] overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
        {/* Imagem do sorteio grátis */}
        {srcToUse ? (
          <motion.img
            src={srcToUse}
            alt="Sorteio Grátis TV 43 polegadas"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-blue-700 text-white text-xl font-bold opacity-80">
            Imagem não encontrada
          </div>
        )}
        {/* Texto sobreposto */}
        <div className="relative z-10 flex justify-center items-center w-full h-full">
          <div className="backdrop-blur-sm bg-white/30 border border-white/40 rounded-xl px-3 py-2 md:px-6 md:py-3 shadow-lg max-w-lg mx-auto text-center">
            <span className="text-base md:text-xl font-bold text-blue-900 drop-shadow-lg">
              🎉 Clique aqui, a cada R$ 7,00 em compras na ação você garante mais 5 números para o sorteio da TV de 43°!
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  );
};

export default Banner;