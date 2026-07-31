import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { Vault, CalendarClock, Coins, RefreshCw } from 'lucide-react';

export default function VaultPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => (await api.get('/purchases')).data,
  });

  const claimMutation = useMutation({
    mutationFn: async (id) => (await api.post(`/purchases/${id}/claimReward`)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['purchases']);
      queryClient.invalidateQueries(['dashboardSummary']);
      toast({ title: 'Reward Claimed!', description: `+${data.amount} ETB added to balance`, type: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Claim failed', description: err.response?.data?.message || 'Error', type: 'error' });
    }
  });

  if (isLoading) return <div className="text-center py-10 text-ink-muted">Loading your vault...</div>;

  const activePurchases = purchases?.filter(p => p.status === 'active') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="u-page-header flex items-center gap-2"><Vault size={24} /> My Vault</h1>
        <p className="u-page-sub">Claim your daily returns from active investments</p>
      </div>

      {activePurchases.length === 0 ? (
        <div className="u-card text-center py-10 border-dashed border-surface-border">
          <Vault size={48} className="mx-auto text-ink-faint mb-4" />
          <p className="text-ink-muted mb-4">No active products found.</p>
          <a href="/products" className="u-btn-outline text-sm">Browse VIP Products</a>
        </div>
      ) : (
        <div className="space-y-4">
          {activePurchases.map(p => {
            let readyToClaim = true;
            let remainingText = '';
            
            if (p.last_claimed_at) {
              const lastTime = new Date(p.last_claimed_at).getTime();
              const hoursSince = (Date.now() - lastTime) / (1000 * 60 * 60);
              if (hoursSince < 24) {
                readyToClaim = false;
                const hrsRemaining = Math.ceil(24 - hoursSince);
                remainingText = `Ready in ${hrsRemaining}h`;
              }
            }

            return (
              <div key={p.id} className="u-card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-ink">{p.name}</h3>
                    <p className="text-xs text-ink-muted">Level {p.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-brand-600">+{p.daily_return} ETB / day</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="bg-surface-page rounded-xl p-2.5 border border-surface-border">
                    <span className="text-ink-faint block mb-0.5">Purchased</span>
                    <span className="text-ink font-mono">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="bg-surface-page rounded-xl p-2.5 border border-surface-border">
                    <span className="text-ink-faint block mb-0.5">Total Earned</span>
                    <span className="text-brand-600 font-mono font-semibold">{parseFloat(p.total_earned).toLocaleString()} ETB</span>
                  </div>
                </div>

                <button 
                  onClick={() => claimMutation.mutate(p.id)}
                  disabled={!readyToClaim || claimMutation.isPending}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    readyToClaim 
                      ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-900/20 active:scale-95' 
                      : 'bg-gray-100 text-ink-faint cursor-not-allowed border border-surface-border'
                  }`}
                >
                  {claimMutation.isPending ? (
                    <><RefreshCw size={18} className="animate-spin"/> Processing...</>
                  ) : readyToClaim ? (
                    <><Coins size={18}/> Claim {p.daily_return} ETB</>
                  ) : (
                    <><CalendarClock size={18}/> {remainingText}</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
