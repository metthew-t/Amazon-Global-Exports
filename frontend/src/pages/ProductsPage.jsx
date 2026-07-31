import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { Package, ShieldCheck, Zap } from 'lucide-react';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

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
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardSummary']);
      toast({ title: 'VIP Purchase Successful!', description: 'Product is now active in your vault.', type: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Purchase Failed', description: err.response?.data?.message || 'Error', type: 'error' });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="u-page-header flex items-center gap-2"><Package size={24}/> VIP Products</h1>
        <p className="u-page-sub">Invest in VIP levels to earn daily returns</p>
      </div>

      <div className="u-card-brand bg-gradient-to-r from-brand-50 to-white flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-muted">Available Balance</p>
          <p className="text-xl font-bold text-ink font-mono">{summary?.balance ? summary.balance.toLocaleString() : '0'} <span className="text-sm text-brand-600">ETB</span></p>
        </div>
        <ShieldCheck size={28} className="text-brand-400" />
      </div>

      {isLoading ? (
        <p className="text-center text-ink-muted py-10">Loading products...</p>
      ) : (
        <div className="grid gap-4">
          {products?.map((p) => (
            <div key={p.id} className="u-card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-ink text-lg">{p.name}</h3>
                  <p className="text-xs text-ink-muted">{p.duration_days} days investment</p>
                </div>
                <span className="bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold px-2 py-1 rounded-lg">Level {p.level}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-page rounded-xl p-3 text-center">
                  <p className="text-[10px] text-ink-faint uppercase">Price</p>
                  <p className="font-bold text-ink font-mono">{parseFloat(p.price).toLocaleString()} ETB</p>
                </div>
                <div className="bg-surface-page rounded-xl p-3 text-center">
                  <p className="text-[10px] text-ink-faint uppercase">Daily Return</p>
                  <p className="font-bold text-brand-600 font-mono flex items-center justify-center gap-1"><Zap size={12}/>{parseFloat(p.daily_return).toLocaleString()} ETB</p>
                </div>
              </div>
              <button
                onClick={() => buyMutation.mutate(p.id)}
                disabled={buyMutation.isPending || (summary?.balance ?? 0) < parseFloat(p.price)}
                className="u-btn-primary w-full py-2.5"
              >
                {buyMutation.isPending ? 'Processing...' : (summary?.balance ?? 0) < parseFloat(p.price) ? 'Insufficient Balance' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
