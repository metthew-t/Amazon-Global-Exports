import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { Gift, Users, ChevronRight, CheckCircle, Clock } from 'lucide-react';

export default function TeamRewardPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: teamSize } = useQuery({
    queryKey: ['teamSize'],
    queryFn: async () => (await api.get('/team/referrals')).data?.teamSize || 0,
  });

  const { data: myRewards } = useQuery({
    queryKey: ['myTeamRewards'],
    queryFn: async () => (await api.get('/team/my-rewards')).data,
  });

  const requestMutation = useMutation({
    mutationFn: async (level) => (await api.post('/team/reward-request', { level })).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['myTeamRewards']);
      toast({ title: 'Request submitted', description: 'Pending admin approval.', type: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Request failed', description: err.response?.data?.message || 'Error', type: 'error' });
    }
  });

  const { data: levelsData, isLoading: isLoadingLevels } = useQuery({
    queryKey: ['teamLevels'],
    queryFn: async () => (await api.get('/team/levels')).data,
  });

  const levels = levelsData ? [
    { id: 'A', name: 'Level A', minTeam: levelsData.A.min, amount: levelsData.A.amount, desc: `Invite ${levelsData.A.min} active members` },
    { id: 'B', name: 'Level B', minTeam: levelsData.B.min, amount: levelsData.B.amount, desc: `Invite ${levelsData.B.min} active members` },
    { id: 'C', name: 'Level C', minTeam: levelsData.C.min, amount: levelsData.C.amount, desc: `Invite ${levelsData.C.min} active members` },
  ] : [];

  if (isLoadingLevels) return <div className="text-ink-muted text-center py-10 animate-pulse">Loading rewards...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="u-page-header flex items-center gap-2"><Gift size={24} /> Team Rewards</h1>
        <p className="u-page-sub">Build your team and claim level bonuses</p>
      </div>

      <div className="u-card-brand text-center py-6">
        <Users size={32} className="mx-auto text-brand-600 mb-2" />
        <p className="text-xs text-ink-muted uppercase tracking-widest mb-1 font-semibold">Your Team Size</p>
        <p className="text-3xl font-bold text-ink font-mono">{teamSize !== undefined ? teamSize : '...'}</p>
      </div>

      <div className="space-y-4">
        <h2 className="u-section-title">Reward Tiers</h2>
        {levels.map((lvl) => {
          const isEligible = teamSize >= lvl.minTeam;
          const claimed = myRewards?.find(r => r.level === lvl.id && r.status !== 'rejected');
          
          return (
            <div key={lvl.id} className="u-card relative overflow-hidden p-0 border-surface-border">
              <div className="p-4 border-b border-surface-border bg-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-brand-700">{lvl.name}</h3>
                  <p className="text-xs text-ink-muted mt-1">{lvl.desc}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-ink font-mono">+{lvl.amount}</p>
                  <p className="text-[10px] text-ink-faint">ETB Bonus</p>
                </div>
              </div>
              
              <div className="p-3 bg-surface-input flex items-center justify-between">
                <div className="flex-1">
                  <div className="w-full bg-surface-border rounded-full h-2 mb-1 overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isEligible ? 'bg-brand-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-brand-300'}`} 
                      style={{ width: `${Math.min(100, ((teamSize || 0) / lvl.minTeam) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-ink-muted font-mono text-right">{teamSize || 0} / {lvl.minTeam}</p>
                </div>

                <div className="ml-4 shrink-0">
                  {claimed ? (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border font-semibold ${
                      claimed.status === 'approved' ? 'bg-brand-50 text-brand-600 border-brand-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {claimed.status === 'approved' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                      {claimed.status.toUpperCase()}
                    </span>
                  ) : (
                    <button 
                      onClick={() => requestMutation.mutate(lvl.id)}
                      disabled={!isEligible || requestMutation.isPending}
                      className={`u-btn text-xs px-3 py-1.5 ${isEligible ? 'u-btn-primary' : 'bg-gray-100 text-ink-faint border border-surface-border shadow-none'}`}
                    >
                      {requestMutation.isPending ? '...' : isEligible ? 'Claim Now' : 'Locked'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
