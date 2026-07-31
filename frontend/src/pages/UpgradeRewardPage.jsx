import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { TrendingUp, Package, CheckCircle, Clock } from 'lucide-react';

export default function UpgradeRewardPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: purchases, isLoading: pLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => (await api.get('/purchases')).data,
  });

  const { data: history, isLoading: hLoading } = useQuery({
    queryKey: ['upgradeRewards'],
    queryFn: async () => (await api.get('/upgrades/history')).data,
  });

  const requestMutation = useMutation({
    mutationFn: async (vipLevel) => (await api.post('/upgrades/request', { vipLevel })).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['upgradeRewards']);
      toast({ title: 'Request submitted', description: 'Pending admin approval.', type: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Request failed', description: err.response?.data?.message || 'Error', type: 'error' });
    }
  });

  const activeProducts = purchases?.filter(p => p.status === 'active') || [];
  
  // Calculate highest owned VIP level
  const maxVipOwned = activeProducts.reduce((max, p) => p.level > max ? p.level : max, 0);

  const { data: levelsData, isLoading: isLoadingLevels } = useQuery({
    queryKey: ['upgradeLevels'],
    queryFn: async () => (await api.get('/upgrades/levels')).data,
  });

  // Define bonus mapping - ignore index 0 since levels are 1-15
  const bonusAmounts = levelsData ? levelsData.slice(1) : [];

  if (pLoading || hLoading || isLoadingLevels) return <div className="text-ink-muted text-center py-10 animate-pulse">Loading rewards...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="u-page-header flex items-center gap-2"><TrendingUp size={24} /> Upgrade Rewards</h1>
        <p className="u-page-sub">Claim bonuses for upgrading your VIP level</p>
      </div>

      <div className="u-card-brand bg-brand-50 border-brand-200 text-center py-6 shadow-inner">
        <Package size={32} className="mx-auto text-brand-600 mb-2" />
        <p className="text-xs text-ink-muted uppercase tracking-widest mb-1 font-semibold">Your Highest VIP Level</p>
        <p className="text-3xl font-bold text-ink font-mono">Level {maxVipOwned}</p>
      </div>

      <div className="space-y-3">
        <h2 className="u-section-title">Available Rewards</h2>
        {bonusAmounts.map((amount, idx) => {
          const level = idx + 1;
          const isEligible = maxVipOwned >= level;
          const requested = history?.find(h => h.vip_level === level && h.status !== 'rejected');

          return (
            <div key={level} className="u-card p-3 flex justify-between items-center border border-surface-border">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border ${
                  isEligible ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-surface-page border-surface-border text-ink-faint'
                }`}>
                  L{level}
                </div>
                <div>
                  <p className={`font-bold ${isEligible ? 'text-ink' : 'text-ink-muted'}`}>VIP {level} Bonus</p>
                  <p className={`text-xs font-mono ${isEligible ? 'text-brand-600' : 'text-ink-faint'}`}>+{amount.toLocaleString()} ETB</p>
                </div>
              </div>

              <div>
                {requested ? (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border font-semibold ${
                    requested.status === 'approved' ? 'bg-brand-50 text-brand-600 border-brand-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {requested.status === 'approved' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                    {requested.status.toUpperCase()}
                  </span>
                ) : (
                  <button 
                    onClick={() => requestMutation.mutate(level)}
                    disabled={!isEligible || requestMutation.isPending}
                    className={`u-btn text-xs px-3 py-1.5 ${isEligible ? 'u-btn-primary' : 'bg-gray-100 text-ink-faint shadow-none border border-surface-border'}`}
                  >
                    {requestMutation.isPending ? '...' : isEligible ? 'Claim' : 'Locked'}
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
