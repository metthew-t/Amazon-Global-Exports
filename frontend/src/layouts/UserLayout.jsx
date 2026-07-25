import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, Vault, ArrowDownCircle, ArrowUpCircle,
  Users, Gift, Star, Coins, CalendarCheck, TrendingUp, User, LogOut, MessageCircle
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/products', icon: Package, label: 'VIP' },
  { to: '/vault', icon: Vault, label: 'Vault' },
  { to: '/deposit', icon: ArrowDownCircle, label: 'Deposit' },
  { to: '/withdraw', icon: ArrowUpCircle, label: 'Withdraw' },
  { to: '/network', icon: Users, label: 'Network' },
  { to: '/team-reward', icon: Gift, label: 'Team' },
  { to: '/lucky-wheel', icon: Star, label: 'Lucky' },
  { to: '/meeting-rewards', icon: CalendarCheck, label: 'Meeting' },
  { to: '/upgrade-reward', icon: TrendingUp, label: 'Upgrade' },
  { to: '/support', icon: MessageCircle, label: 'Support' },
  { to: '/account', icon: User, label: 'Account' },
];

export default function UserLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-dvh flex flex-col bg-gray-950 max-w-md mx-auto relative">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Amazon Global Exports</p>
          <p className="font-semibold text-sky-400 text-sm">{user?.full_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{user?.referral_code}</span>
          <button onClick={logout} className="btn-ghost text-gray-500 p-2 rounded-lg hover:text-red-400"><LogOut size={16} /></button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 px-4 py-5 pb-32 overflow-y-auto animate-fade-in">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-gray-950/95 backdrop-blur border-t border-gray-800 z-50">
        <div className="flex items-center justify-around overflow-x-auto px-1 py-1 gap-0 scrollbar-none">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `nav-item min-w-[52px] ${isActive ? 'nav-item-active' : ''}`
            }>
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-sky-400' : ''} />
                  <span className={`text-[9px] font-semibold tracking-tight ${isActive ? 'text-sky-400' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
