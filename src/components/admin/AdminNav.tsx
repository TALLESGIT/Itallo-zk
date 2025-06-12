import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GiftIcon,
  Settings,
  ListChecks,
  Gamepad2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminNav: React.FC = () => {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingRequests();
    
    // Subscribe to changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitacoes'
        },
        () => {
          fetchPendingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingRequests = async () => {
    const { data } = await supabase
      .from('solicitacoes')
      .select('id')
      .eq('status', 'pendente');
    
    setPendingCount(data?.length || 0);
  };

  const navItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: '/admin/participants',
      label: 'Participantes',
      icon: <Users size={20} />,
    },
    {
      path: '/admin/requests',
      label: 'Solicitações',
      icon: <ListChecks size={20} />,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      path: '/admin/draw',
      label: 'Sorteio',
      icon: <GiftIcon size={20} />,
    },
    {
      path: '/admin/games',
      label: 'Brincadeiras',
      icon: <Gamepad2 size={20} />,
    },
    {
      path: '/admin/settings',
      label: 'Configurações',
      icon: <Settings size={20} />,
    },
  ];

  return (
    <nav className="bg-white shadow-md rounded-lg p-4 sticky top-20">
      <ul className="space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default AdminNav;