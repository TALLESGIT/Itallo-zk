import { Heart, Phone, Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16">
          <div>
            <motion.h3 
              className="text-xl font-bold mb-6 text-white relative inline-block"
              whileHover={{ scale: 1.05 }}
            >
              Sobre a ZK Premios
              <div className="absolute -bottom-2 left-0 w-12 h-1 bg-primary rounded-full"></div>
            </motion.h3>
            <p className="text-gray-300 leading-relaxed">
              A ZK Premios é sua plataforma confiável para participar de sorteios 
              transparentes e seguros. Realize seus sonhos conosco!
            </p>
          </div>
          
          <div>
            <motion.h3 
              className="text-xl font-bold mb-6 text-white relative inline-block"
              whileHover={{ scale: 1.05 }}
            >
              Links Úteis
              <div className="absolute -bottom-2 left-0 w-12 h-1 bg-primary rounded-full"></div>
            </motion.h3>
            <ul className="space-y-4">
              <motion.li whileHover={{ x: 5 }}>
                <a 
                  href="https://zksorteios.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                >
                  Site Principal
                </a>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <a 
                  href="https://zksorteios.com.br/campanha/r-usd-10-000-00-reias-no-pix-2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                >
                  Campanha Atual
                </a>
              </motion.li>
            </ul>
          </div>
          
          <div>
            <motion.h3 
              className="text-xl font-bold mb-6 text-white relative inline-block"
              whileHover={{ scale: 1.05 }}
            >
              Contato
              <div className="absolute -bottom-2 left-0 w-12 h-1 bg-primary rounded-full"></div>
            </motion.h3>
            <ul className="space-y-4">
              <motion.li 
                className="flex items-center gap-3 text-gray-300"
                whileHover={{ x: 5 }}
              >
                <Phone size={20} className="text-primary" />
                (31) 97239-3341
              </motion.li>
              <motion.li 
                className="flex items-center gap-3 text-gray-300"
                whileHover={{ x: 5 }}
              >
                <Mail size={20} className="text-primary" />
                contato@zkpremios.com
              </motion.li>
              <motion.li 
                className="flex items-center gap-3 text-gray-300"
                whileHover={{ x: 5 }}
              >
                <MapPin size={20} className="text-primary" />
                Belo Horizonte, MG
              </motion.li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} ZK Premios. Todos os direitos reservados.
            </p>
            
            <motion.a
              href="https://wa.me/5533999030124"
              target="_blank"
              rel="noopener noreferrer" 
              className="text-sm text-gray-400 flex items-center hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Feito com <Heart size={14} className="text-red-500 mx-1" /> por Tales Coelho
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;