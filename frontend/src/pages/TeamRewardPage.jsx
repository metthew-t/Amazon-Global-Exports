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

  if (isLoadingLevels) return <div className="text-gray-500 text-center py-10 animate-pulse">Loading rewards...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header flex items-center gap-2"><Gift size={24} /> Team Rewards</h1>
        <p className="page-sub">Build your team and claim level bonuses</p>
      </div>

      <div className="card-gold text-center py-6">
        <Users size={32} className="mx-auto text-sky-400 mb-2" />
        <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Your Team Size</p>
        <p className="text-3xl font-bold text-white font-mono">{teamSize !== undefined ? teamSize : '...'}</p>
      </div>

      <div className="space-y-4">
        <h2 className="section-title">Reward Tiers</h2>
        {levels.map((lvl) => {
          const isEligible = teamSize >= lvl.minTeam;
          const claimed = myRewards?.find(r => r.level === lvl.id && r.status !== 'rejected');
          
          return (
            <div key={lvl.id} className="card relative overflow-hidden border border-gray-800 p-0">
              <div className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-sky-400">{lvl.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{lvl.desc}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white font-mono">+{lvl.amount}</p>
                  <p className="text-[10px] text-gray-500">ETB Bonus</p>
                </div>
              </div>
              
              <div className="p-3 bg-gray-950 flex items-center justify-between">
                <div className="flex-1">
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mb-1">
                    <div 
                      className={`h-1.5 rounded-full ${isEligible ? 'bg-green-500' : 'bg-sky-500'}`} 
                      style={{ width: `${Math.min(100, ((teamSize || 0) / lvl.minTeam) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono text-right">{teamSize || 0} / {lvl.minTeam}</p>
                </div>

                <div className="ml-4 shrink-0">
                  {claimed ? (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${
                      claimed.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {claimed.status === 'approved' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                      {claimed.status.toUpperCase()}
                    </span>
                  ) : (
                    <button 
                      onClick={() => requestMutation.mutate(lvl.id)}
                      disabled={!isEligible || requestMutation.isPending}
                      className={`btn text-xs px-3 py-1.5 ${isEligible ? 'btn-primary' : 'bg-gray-800 text-gray-500'}`}
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
