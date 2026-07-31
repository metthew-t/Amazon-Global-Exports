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
        <h1 className="u-page-header flex items-center gap-2"><CalendarCheck size={24} /> Meeting Rewards</h1>
        <p className="u-page-sub">Enter codes shared during official meetings</p>
      </div>

      <div className="u-card-brand bg-brand-50 border-brand-200">
        <label className="u-label text-brand-700 mb-2 text-center">Enter Meeting Code</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={code} 
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. GOLD-WEEK-123" 
            className="u-input uppercase text-center font-mono tracking-widest text-lg bg-white border-brand-300 focus:border-brand-500 focus:ring-brand-500/30"
          />
        </div>
        <button 
          onClick={() => {
            if(code.trim()) claimMutation.mutate(code.trim());
          }}
          disabled={!code.trim() || claimMutation.isPending}
          className="u-btn-primary w-full mt-4 py-3 text-lg"
        >
          {claimMutation.isPending ? 'Verifying...' : 'Claim Reward'}
        </button>
      </div>

      <div>
        <h2 className="u-section-title">Claim History</h2>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-center text-sm text-ink-muted py-4">Loading...</p>
          ) : history?.length === 0 ? (
            <p className="text-center text-sm text-ink-faint py-4">No codes claimed yet</p>
          ) : (
            history?.map((h) => (
              <div key={h.id} className="u-card p-3 flex justify-between items-center border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                    <CheckCircle size={16}/>
                  </div>
                  <div>
                    <p className="font-mono text-ink font-bold text-sm">{h.code}</p>
                    <p className="text-[10px] text-ink-muted">{new Date(h.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-600">+{h.amount} ETB</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
