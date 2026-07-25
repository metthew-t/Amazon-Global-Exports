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

  if (isLoading) return <div className="text-center py-10 text-gray-500">Loading your vault...</div>;

  const activePurchases = purchases?.filter(p => p.status === 'active') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header flex items-center gap-2"><Vault size={24} /> My Vault</h1>
        <p className="page-sub">Claim your daily returns from active investments</p>
      </div>

      {activePurchases.length === 0 ? (
        <div className="card text-center py-10 border-dashed border-gray-700">
          <Vault size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 mb-4">No active products found.</p>
          <a href="/products" className="btn-outline text-sm">Browse VIP Products</a>
        </div>
      ) : (
        <div className="space-y-4">
          {activePurchases.map(p => {
            // Calculate if ready to claim
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
              <div key={p.id} className="card bg-gray-900 border border-gray-800">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-gray-400">Level {p.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-sky-400">+{p.daily_return} ETB / day</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="bg-gray-950 rounded p-2 border border-gray-800">
                    <span className="text-gray-500 block mb-0.5">Purchased</span>
                    <span className="text-gray-300 font-mono">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="bg-gray-950 rounded p-2 border border-gray-800">
                    <span className="text-gray-500 block mb-0.5">Total Earned</span>
                    <span className="text-green-400 font-mono font-semibold">{parseFloat(p.total_earned).toLocaleString()} ETB</span>
                  </div>
                </div>

                <button 
                  onClick={() => claimMutation.mutate(p.id)}
                  disabled={!readyToClaim || claimMutation.isPending}
                  className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    readyToClaim 
                      ? 'bg-sky-500 text-gray-950 hover:bg-sky-400 shadow-lg shadow-sky-900/30' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
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
