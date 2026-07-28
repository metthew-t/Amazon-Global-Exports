import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

// Public
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';

// User Layout + Pages
import UserLayout from './layouts/UserLayout';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import VaultPage from './pages/VaultPage';
import DepositPage from './pages/DepositPage';
import WithdrawPage from './pages/WithdrawPage';
import AccountPage from './pages/AccountPage';
import NetworkPage from './pages/NetworkPage';
import TeamRewardPage from './pages/TeamRewardPage';
import LuckyWheelPage from './pages/LuckyWheelPage';
import MeetingRewardsPage from './pages/MeetingRewardsPage';
import UpgradeRewardPage from './pages/UpgradeRewardPage';
import SupportPage from './pages/SupportPage';

// Admin Layout + Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDepositsPage from './pages/admin/AdminDepositsPage';
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminTeamRewardsPage from './pages/admin/AdminTeamRewardsPage';
import AdminMeetingCodesPage from './pages/admin/AdminMeetingCodesPage';
import AdminLuckyWheelPage from './pages/admin/AdminLuckyWheelPage';
import AdminUpgradeRewardsPage from './pages/admin/AdminUpgradeRewardsPage';
import AdminActiveUsersPage from './pages/admin/AdminActiveUsersPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user || !user.is_admin) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.is_admin ? '/admin/dashboard' : '/dashboard'} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/admin/login" element={<PublicRoute><AdminLoginPage /></PublicRoute>} />

          {/* User */}
          <Route path="/" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="purchases" element={<VaultPage />} />
            <Route path="deposit" element={<DepositPage />} />
            <Route path="withdraw" element={<WithdrawPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="network" element={<NetworkPage />} />
            <Route path="team" element={<NetworkPage />} />
            <Route path="team-reward" element={<TeamRewardPage />} />
            <Route path="lucky-wheel" element={<LuckyWheelPage />} />
            <Route path="lucky-draw" element={<LuckyWheelPage />} />
            <Route path="meeting-rewards" element={<MeetingRewardsPage />} />
            <Route path="upgrade-reward" element={<UpgradeRewardPage />} />
            <Route path="support" element={<SupportPage />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="active-users" element={<AdminActiveUsersPage />} />
            <Route path="deposits" element={<AdminDepositsPage />} />
            <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="team-rewards" element={<AdminTeamRewardsPage />} />
            <Route path="team-reward-requests" element={<AdminTeamRewardsPage />} />
            <Route path="meeting-codes" element={<AdminMeetingCodesPage />} />
            <Route path="lucky-wheel" element={<AdminLuckyWheelPage />} />
            <Route path="upgrade-rewards" element={<AdminUpgradeRewardsPage />} />
            <Route path="upgrade-reward-requests" element={<AdminUpgradeRewardsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
