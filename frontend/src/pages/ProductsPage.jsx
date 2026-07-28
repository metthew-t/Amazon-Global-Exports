import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { Package, Zap, Clock, ShieldCheck, ChevronRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products')).data,
  });

  const { data: summary } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data,
  });

  const buyMutation = useMutation({
    mutationFn: async (productId) => (await api.post('/purchases', { productId })).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboardSummary']);
      queryClient.invalidateQueries(['purchases']);
      toast({ title: 'Purchase successful!', description: 'Check your vault to claim daily rewards.', type: 'success' });
      navigate('/vault');
    },
    onError: (err) => {
      toast({ title: 'Purchase failed', description: err.response?.data?.message || 'Error occurred', type: 'error' });
    }
  });

  if (isLoading) return <div className="text-center py-10 text-gray-500 animate-pulse">Loading VIP Products...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header flex items-center gap-2"><Package size={24} /> VIP Products</h1>
        <p className="page-sub">Upgrade your level to earn higher daily returns</p>
      </div>

      <div className="card-gold bg-sky-900/10 border-sky-500/20 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Available Balance</p>
          <p className="text-lg font-bold text-sky-400">{summary?.balance ? summary.balance.toLocaleString() : '0.00'} ETB</p>
        </div>
        <button onClick={() => navigate('/deposit')} className="btn-outline text-xs py-1.5">Deposit</button>
      </div>

      <div className="space-y-4">
        {products?.map((p) => {
          const isLocked = !p.is_active;

          return (
            <div key={p.id} className={`card relative overflow-hidden group ${isLocked ? 'opacity-70 grayscale' : ''}`}>
              <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                {isLocked ? <Lock size={100} className="text-gray-500" /> : <ShieldCheck size={100} className="text-sky-500" />}
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-xl font-serif ${isLocked ? 'text-gray-400' : 'text-sky-400'}`}>{p.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border mt-1 ${isLocked ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-sky-500/10 text-sky-300 border-sky-500/20'}`}>
                      Level {p.level}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Price</p>
                    <p className="text-lg font-bold text-white">{parseFloat(p.price).toLocaleString()} ETB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-950 rounded-lg p-2.5 border border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Zap size={12}/> Daily Return</p>
                    <p className={`${isLocked ? 'text-gray-500' : 'text-green-400'} font-mono font-semibold mt-0.5`}>+{parseFloat(p.daily_return).toLocaleString()} ETB</p>
                  </div>
                  <div className="bg-gray-950 rounded-lg p-2.5 border border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Clock size={12}/> Duration</p>
                    <p className={`${isLocked ? 'text-gray-500' : 'text-gray-300'} font-mono font-semibold mt-0.5`}>{p.duration_days} Days</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-gray-950 rounded-lg p-2.5 border border-gray-800 flex justify-between items-center">
                    <p className="text-[10px] text-gray-500 uppercase">Monthly Expected</p>
                    <p className={`${isLocked ? 'text-gray-500' : 'text-sky-400'} font-mono font-bold`}>
                      {parseFloat(p.daily_return * p.duration_days).toLocaleString()} ETB
                    </p>
                  </div>
                  <div className="bg-gray-950 rounded-lg p-2.5 border border-gray-800 flex justify-between items-center">
                    <p className="text-[10px] text-gray-500 uppercase">Yearly Expected</p>
                    <p className={`${isLocked ? 'text-gray-500' : 'text-green-400'} font-mono font-bold`}>
                      {parseFloat(p.daily_return * p.duration_days * 12).toLocaleString()} ETB
                    </p>
                  </div>
                </div>

                {isLocked ? (
                  <button disabled className="btn-secondary w-full justify-center gap-2 cursor-not-allowed opacity-50 bg-gray-800 text-gray-400 border-gray-700">
                    <Lock size={18} /> Locked
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      if (window.confirm(`Buy ${p.name} for ${p.price} ETB?`)) {
                        buyMutation.mutate(p.id);
                      }
                    }}
                    disabled={buyMutation.isPending}
                    className="btn-primary w-full justify-between"
                  >
                    {buyMutation.isPending ? 'Processing...' : 'Buy Now'}
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
