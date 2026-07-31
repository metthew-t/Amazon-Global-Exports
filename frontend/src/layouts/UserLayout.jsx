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
    <div className="u-page max-w-md mx-auto relative flex flex-col">
      {/* Top Header */}
      <header className="u-header">
        <div>
          <p className="text-[10px] text-ink-faint uppercase tracking-widest font-semibold">Amazon Global Exports</p>
          <p className="font-semibold text-brand-600 text-sm">{user?.full_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-muted bg-brand-50 border border-brand-200 px-2 py-1 rounded-lg">{user?.referral_code}</span>
          <button onClick={logout} className="u-btn-ghost text-ink-faint p-2 rounded-lg hover:text-red-500"><LogOut size={16} /></button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 px-4 py-5 pb-32 overflow-y-auto animate-fade-in">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="u-nav">
        <div className="flex items-center justify-around overflow-x-auto px-1 py-1 gap-0 scrollbar-none">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `u-nav-item min-w-[52px] ${isActive ? 'u-nav-item-active' : ''}`
            }>
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-brand-600' : ''} />
                  <span className={`text-[9px] font-semibold tracking-tight ${isActive ? 'text-brand-600' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
