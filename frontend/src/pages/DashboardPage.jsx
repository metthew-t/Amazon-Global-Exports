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

      <div className="card-gold bg-gradient-to-br from-gray-900 to-gray-800 border-sky-500/30 shadow-lg shadow-sky-500/5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-sm font-medium flex items-center gap-2"><Wallet size={16} className="text-sky-400"/> Total Balance</p>
          <span className="badge-active bg-sky-500/20 text-sky-300 border-sky-500/30">ETB</span>
        </div>
        <h2 className="text-4xl font-bold text-white tracking-tight">{isLoading ? '...' : (stats?.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        <div className="flex gap-2 mt-4">
          <Link to="/withdraw" className="btn-outline flex-1 text-sm justify-center"><ArrowUpCircle size={16}/> Withdraw</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <p className="stat-label flex items-center gap-1.5"><ArrowDownCircle size={14}/> Total Deposit</p>
          <p className="stat-value">{isLoading ? '...' : (stats?.totalDeposited || 0).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label flex items-center gap-1.5"><ArrowUpCircle size={14}/> Total Withdraw</p>
          <p className="stat-value">{isLoading ? '...' : (stats?.totalWithdrawn || 0).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label flex items-center gap-1.5"><Package size={14}/> Active Products</p>
          <p className="stat-value">{isLoading ? '...' : stats?.activeProducts || 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label flex items-center gap-1.5"><Activity size={14}/> Total Invested</p>
          <p className="stat-value">{isLoading ? '...' : (stats?.totalInvested || 0).toLocaleString()}</p>
        </div>
        <div className="stat-card col-span-2">
          <p className="stat-label flex items-center gap-1.5"><Users size={14}/> Total Team Members</p>
          <p className="stat-value">{isLoading ? '...' : stats?.teamSize || 0}</p>
        </div>
      </div>
    </div>
  );
}
