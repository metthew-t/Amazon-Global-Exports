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

  if (pLoading || hLoading || isLoadingLevels) return <div className="text-gray-500 text-center py-10 animate-pulse">Loading rewards...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header flex items-center gap-2"><TrendingUp size={24} /> Upgrade Rewards</h1>
        <p className="page-sub">Claim bonuses for upgrading your VIP level</p>
      </div>

      <div className="card-gold bg-sky-900/10 border-sky-500/20 text-center py-6">
        <Package size={32} className="mx-auto text-sky-400 mb-2" />
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Your Highest VIP Level</p>
        <p className="text-3xl font-bold text-white font-mono">Level {maxVipOwned}</p>
      </div>

      <div className="space-y-3">
        <h2 className="section-title">Available Rewards</h2>
        {bonusAmounts.map((amount, idx) => {
          const level = idx + 1;
          const isEligible = maxVipOwned >= level;
          const requested = history?.find(h => h.vip_level === level && h.status !== 'rejected');

          return (
            <div key={level} className="card p-3 flex justify-between items-center border border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border ${
                  isEligible ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-gray-900 border-gray-700 text-gray-600'
                }`}>
                  L{level}
                </div>
                <div>
                  <p className={`font-semibold ${isEligible ? 'text-gray-200' : 'text-gray-600'}`}>VIP {level} Bonus</p>
                  <p className={`text-xs font-mono ${isEligible ? 'text-green-400' : 'text-gray-600'}`}>+{amount.toLocaleString()} ETB</p>
                </div>
              </div>

              <div>
                {requested ? (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${
                    requested.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {requested.status === 'approved' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                    {requested.status.toUpperCase()}
                  </span>
                ) : (
                  <button 
                    onClick={() => requestMutation.mutate(level)}
                    disabled={!isEligible || requestMutation.isPending}
                    className={`btn text-xs px-3 py-1.5 ${isEligible ? 'btn-primary' : 'bg-gray-800 text-gray-500'}`}
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
