import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Gift, LogOut, User, Trophy } from 'lucide-react';

const Header: React.FC = () => {
  const { authState, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const isAdmin = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const headerClass = `fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
    scrolled || !isHomePage
      ? 'bg-white shadow-md py-2'
      : 'bg-transparent py-4'
  }`;

  return (
    <header className={headerClass}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Gift className="text-primary mr-2" size={28} />
          <Link to="/" className="text-xl md:text-2xl font-bold text-primary">
            Zk Premios
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {!isAdmin && (
            <Link
              to="/ganhadores"
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
            >
              <Trophy size={20} />
              <span className="hidden sm:inline">Ganhadores</span>
            </Link>
          )}

          {isAdmin && authState.isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <User size={16} />
                {authState.user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-red-500 hover:text-red-700"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;