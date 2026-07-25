import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, CreditCard, Wallet, Package, Settings,
  Gift, CalendarCheck, Star, TrendingUp, LogOut
} from 'lucide-react';

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/active-users', icon: Users, label: 'Active Users' },
  { to: '/admin/deposits', icon: CreditCard, label: 'Deposits' },
  { to: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/team-rewards', icon: Gift, label: 'Team Rewards' },
  { to: '/admin/meeting-codes', icon: CalendarCheck, label: 'Meetings' },
  { to: '/admin/lucky-wheel', icon: Star, label: 'Lucky Wheel' },
  { to: '/admin/upgrade-rewards', icon: TrendingUp, label: 'Upgrades' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-gray-950">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-serif text-sky-400">Admin Panel</h2>
          <p className="text-xs text-gray-500">Amazon Global Exports</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={logout} className="w-full btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-serif text-sky-400">Admin Panel</h2>
          <button onClick={logout} className="p-2 text-red-400 bg-red-500/10 rounded-lg"><LogOut size={18} /></button>
        </header>

        {/* Mobile Nav - horizontal scroll */}
        <nav className="md:hidden sticky top-[60px] z-30 bg-gray-950/95 backdrop-blur border-b border-gray-800">
          <div className="flex items-center overflow-x-auto p-2 gap-2 scrollbar-none">
             {adminNav.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium border ${
                  isActive ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-gray-900 text-gray-400 border-gray-800'
                }`
              }>
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
