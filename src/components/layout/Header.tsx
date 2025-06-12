import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Gift, LogOut, User, Trophy, Gamepad2, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const { authState, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Fechar menu mobile quando a rota mudar
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const headerClass = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    scrolled || !isHomePage
      ? 'bg-white shadow-md py-2'
      : 'bg-transparent py-4'
  }`;

  return (
    <>
      <header className={headerClass}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Gift className="text-primary mr-2" size={24} />
            <Link 
              to="/" 
              className="text-lg sm:text-xl md:text-2xl font-bold text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Zk Premios
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {!isAdmin && (
              <>
                <Link
                  to="/ganhadores"
                  className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-medium"
                >
                  <Trophy size={18} />
                  Ganhadores
                </Link>
                <Link
                  to="/brincadeiras"
                  className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-medium"
                >
                  <Gamepad2 size={18} />
                  Brincadeiras
                </Link>
              </>
            )}

            {isAdmin && authState.isAuthenticated && (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  {authState.user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          {!isAdmin && (
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-700 hover:text-primary transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* Admin Mobile Logout */}
          {isAdmin && authState.isAuthenticated && (
            <button
              onClick={handleLogout}
              className="md:hidden flex items-center gap-1 p-2 text-red-500 hover:text-red-700 transition-colors"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && !isAdmin && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      {!isAdmin && (
        <div className={`
          fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 md:hidden
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-6">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Gift className="text-primary mr-2" size={24} />
                <span className="text-lg font-bold text-primary">Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Menu Items */}
            <nav className="space-y-4">
              <Link
                to="/ganhadores"
                className="flex items-center gap-3 p-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Trophy size={20} />
                Ganhadores
              </Link>
              
              <Link
                to="/brincadeiras"
                className="flex items-center gap-3 p-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Gamepad2 size={20} />
                Brincadeiras
              </Link>

              <Link
                to="/"
                className="flex items-center gap-3 p-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Gift size={20} />
                Início
              </Link>
            </nav>

            {/* Mobile Menu Footer */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="text-center text-sm text-gray-500">
                <p className="font-semibold text-primary">Zk Premios</p>
                <p>Sua sorte está aqui! 🍀</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;