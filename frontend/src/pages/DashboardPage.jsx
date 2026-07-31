import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api';
import { Wallet, Package, ArrowDownCircle, ArrowUpCircle, Users, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="page-sub">Welcome back, {user?.full_name}</p>
        </div>
        <Link to="/deposit" className="btn-primary text-sm px-3 py-1.5"><ArrowDownCircle size={16}/> Deposit</Link>
      </div>

      <div className="card-gold bg-gradient-to-br from-gray-900 to-gray-800 border-indigo-500/30 shadow-lg shadow-indigo-500/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-sm font-medium flex items-center gap-2"><Wallet size={16} className="text-indigo-400"/> Total Balance</p>
          <span className="badge-active bg-indigo-500/20 text-indigo-300 border-indigo-500/30">ETB</span>
        </div>
        <h2 className="text-4xl font-bold text-white tracking-tight">{isLoading ? '...' : (stats?.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        <div className="flex gap-2 mt-4">
          <Link to="/withdraw" className="btn-outline flex-1 text-sm justify-center"><ArrowUpCircle size={16}/> Withdraw</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <p className="stat-label flex items-center gap-1.5"><ArrowDownCircle size={14} className="text-green-400"/> Total Deposit</p>
          <p className="text-xl font-bold text-green-400 font-mono">{isLoading ? '...' : (stats?.totalDeposited || 0).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label flex items-center gap-1.5"><ArrowUpCircle size={14} className="text-red-400"/> Total Withdraw</p>
          <p className="text-xl font-bold text-red-400 font-mono">{isLoading ? '...' : (stats?.totalWithdrawn || 0).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label flex items-center gap-1.5"><Package size={14} className="text-purple-400"/> Active Products</p>
          <p className="text-xl font-bold text-purple-400 font-mono">{isLoading ? '...' : stats?.activeProducts || 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label flex items-center gap-1.5"><Activity size={14} className="text-yellow-400"/> Total Invested</p>
          <p className="text-xl font-bold text-yellow-400 font-mono">{isLoading ? '...' : (stats?.totalInvested || 0).toLocaleString()}</p>
        </div>
        <div className="stat-card col-span-2">
          <p className="stat-label flex items-center gap-1.5"><Users size={14} className="text-pink-400"/> Total Team Members</p>
          <p className="text-xl font-bold text-pink-400 font-mono">{isLoading ? '...' : stats?.teamSize || 0}</p>
        </div>
      </div>
    </div>
  );
}
