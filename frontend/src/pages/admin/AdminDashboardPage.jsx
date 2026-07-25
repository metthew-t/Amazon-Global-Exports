import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Users, CreditCard, Wallet, Package, DollarSign } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => (await api.get('/admin/dashboard')).data,
  });

  const { data: bankStats } = useQuery({
    queryKey: ['adminBankStats'],
    queryFn: async () => (await api.get('/admin/bank-stats')).data,
  });

  if (isLoading) return <div className="text-gray-500">Loading admin dashboard...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-serif text-white mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-400 flex items-center gap-2 mb-2"><Users size={16}/> Total Users</p>
          <p className="text-3xl font-bold text-white">{stats?.totalUsers}</p>
        </div>
        
        <div className="card border-l-4 border-l-green-500">
          <p className="text-sm text-gray-400 flex items-center gap-2 mb-2"><CreditCard size={16}/> Total Deposits</p>
          <p className="text-3xl font-bold text-white font-mono">{stats?.totalDeposited.toLocaleString()} ETB</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.totalDepositCount} approved transactions</p>
        </div>
        
        <div className="card border-l-4 border-l-red-500">
          <p className="text-sm text-gray-400 flex items-center gap-2 mb-2"><Wallet size={16}/> Total Withdrawals</p>
          <p className="text-3xl font-bold text-white font-mono">{stats?.totalWithdrawn.toLocaleString()} ETB</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.totalWithdrawalCount} approved transactions</p>
        </div>
        
        <div className="card border-l-4 border-l-gold-500">
          <p className="text-sm text-gray-400 flex items-center gap-2 mb-2"><DollarSign size={16}/> User Balances</p>
          <p className="text-3xl font-bold text-sky-400 font-mono">{stats?.totalUserBalance.toLocaleString()} ETB</p>
          <p className="text-xs text-gray-500 mt-1">Total liability to users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Deposit Breakdown by Bank</h2>
          <div className="space-y-4">
            {bankStats?.map((b) => (
              <div key={b.bank_type} className="flex justify-between items-center">
                <span className="font-medium text-gray-300">{b.bank_type}</span>
                <div className="text-right">
                  <p className="font-bold text-green-400 font-mono">+{parseFloat(b.total).toLocaleString()} ETB</p>
                  <p className="text-xs text-gray-500">{b.count} transactions</p>
                </div>
              </div>
            ))}
            {bankStats?.length === 0 && <p className="text-gray-500 text-sm">No approved deposits yet.</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Platform Activity</h2>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400"><Package size={16} className="inline mr-2"/> Active VIP Products</span>
            <span className="font-bold text-white">{stats?.activeProducts}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
