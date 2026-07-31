import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { CalendarCheck, Gift, CheckCircle } from 'lucide-react';

export default function MeetingRewardsPage() {
  const [code, setCode] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: history, isLoading } = useQuery({
    queryKey: ['meetingRewards'],
    queryFn: async () => (await api.get('/meetings/history')).data,
  });

  const claimMutation = useMutation({
    mutationFn: async (code) => (await api.post('/meetings/claim', { code })).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['meetingRewards']);
      queryClient.invalidateQueries(['dashboardSummary']);
      toast({ title: 'Code Claimed!', description: `+${data.amount} ETB added`, type: 'success' });
      setCode('');
    },
    onError: (err) => {
      toast({ title: 'Claim failed', description: err.response?.data?.message || 'Invalid code', type: 'error' });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header flex items-center gap-2"><CalendarCheck size={24} /> Meeting Rewards</h1>
        <p className="page-sub">Enter codes shared during official meetings</p>
      </div>

      <div className="card-gold bg-sky-900/10 border-sky-500/20">
        <label className="label text-sky-400 mb-2 text-center">Enter Meeting Code</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={code} 
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. GOLD-WEEK-123" 
            className="input uppercase text-center font-mono tracking-widest text-lg"
          />
        </div>
        <button 
          onClick={() => {
            if(code.trim()) claimMutation.mutate(code.trim());
          }}
          disabled={!code.trim() || claimMutation.isPending}
          className="btn-primary w-full mt-4 py-3"
        >
          {claimMutation.isPending ? 'Verifying...' : 'Claim Reward'}
        </button>
      </div>

      <div>
        <h2 className="section-title">Claim History</h2>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-center text-sm text-gray-500 py-4">Loading...</p>
          ) : history?.length === 0 ? (
            <p className="text-center text-sm text-gray-600 py-4">No codes claimed yet</p>
          ) : (
            history?.map((h) => (
              <div key={h.id} className="card p-3 flex justify-between items-center border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center">
                    <CheckCircle size={16}/>
                  </div>
                  <div>
                    <p className="font-mono text-gray-300 font-bold text-sm">{h.code}</p>
                    <p className="text-[10px] text-gray-500">{new Date(h.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">+{h.amount} ETB</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
