import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { Star, Ticket, Clock, Trophy } from 'lucide-react';

export default function LuckyWheelPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: wheelData, isLoading } = useQuery({
    queryKey: ['luckyWheelCurrent'],
    queryFn: async () => (await api.get('/lucky-wheel/current')).data,
  });

  const { data: history } = useQuery({
    queryKey: ['luckyWheelHistory'],
    queryFn: async () => (await api.get('/lucky-wheel/history')).data,
  });

  const buyMutation = useMutation({
    mutationFn: async () => (await api.post('/lucky-wheel/buy-ticket')).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['luckyWheelCurrent']);
      queryClient.invalidateQueries(['dashboardSummary']);
      toast({ title: 'Ticket Purchased!', description: 'Good luck!', type: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Purchase failed', description: err.response?.data?.message || 'Error', type: 'error' });
    }
  });

  if (isLoading) return <div className="text-center py-10 text-ink-muted">Loading wheel...</div>;

  if (wheelData?.disabled) {
    return (
      <div className="text-center py-20">
        <Star size={48} className="mx-auto text-ink-faint mb-4" />
        <h2 className="text-xl text-ink-muted font-serif">Lucky Wheel is currently closed</h2>
        <p className="text-sm text-ink-faint mt-2">Check back later for the next round!</p>
      </div>
    );
  }

  const r = wheelData?.round;
  const sold = r ? parseInt(r.tickets_sold) : 0;
  const max = wheelData?.maxParticipants || 100;
  const price = wheelData?.ticketPrice || 50;
  const userTickets = wheelData?.userTickets || 0;

  return (
    <div className="space-y-6 pb-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 border border-brand-200 mb-4 animate-pulse-brand relative">
          <Star size={32} className="text-brand-600" />
        </div>
        <h1 className="text-2xl font-serif text-brand-700 mb-1">Lucky Wheel</h1>
        <p className="text-sm text-ink-muted">Buy a ticket for a chance to win the pot!</p>
      </div>

      <div className="u-card-brand relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-brand-900">
          <Star size={120} />
        </div>
        
        <div className="relative z-10 text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-ink-muted mb-2 font-semibold">Current Pot Amount</p>
          <p className="text-4xl font-bold text-ink font-mono tracking-tight">
            {r?.pot_amount ? parseFloat(r.pot_amount).toLocaleString() : '0'} <span className="text-lg text-brand-600">ETB</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="bg-white rounded-xl p-2 border border-surface-border shadow-sm">
            <p className="text-[10px] text-ink-faint uppercase">Ticket Price</p>
            <p className="text-sm font-bold text-brand-600">{price} ETB</p>
          </div>
          <div className="bg-white rounded-xl p-2 border border-surface-border shadow-sm">
            <p className="text-[10px] text-ink-faint uppercase">Winners</p>
            <p className="text-sm font-bold text-brand-600">{wheelData?.numWinners}</p>
          </div>
          <div className="bg-white rounded-xl p-2 border border-surface-border shadow-sm">
            <p className="text-[10px] text-ink-faint uppercase">Your Tickets</p>
            <p className="text-sm font-bold text-brand-600">{userTickets}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-ink-muted">Tickets Sold</span>
            <span className="text-brand-600 font-mono">{sold} / {max}</span>
          </div>
          <div className="w-full bg-surface-border rounded-full h-3 overflow-hidden shadow-inner relative">
            <div 
              className="h-full bg-brand-500 rounded-full transition-all duration-1000 relative"
              style={{ width: `${(sold / max) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[slideRight_2s_infinite]"></div>
            </div>
          </div>
          <p className="text-center text-[10px] text-ink-faint mt-2">Draw happens when {max} tickets are sold</p>
        </div>

        <button 
          onClick={() => {
            if (window.confirm(`Buy a ticket for ${price} ETB?`)) buyMutation.mutate();
          }}
          disabled={buyMutation.isPending || sold >= max}
          className="u-btn-primary w-full py-4 text-lg font-bold"
        >
          {buyMutation.isPending ? 'Processing...' : sold >= max ? 'Round Full - Drawing...' : <><Ticket size={20}/> Buy Ticket</>}
        </button>
      </div>

      <div>
        <h2 className="u-section-title">Your Ticket History</h2>
        <div className="space-y-3">
          {history?.length === 0 ? (
            <p className="text-center text-sm text-ink-muted py-4">No tickets purchased yet</p>
          ) : (
            history?.map((t) => (
              <div key={t.id} className="u-card p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    t.round_status === 'open' ? 'bg-blue-50 text-blue-500 border border-blue-200' :
                    t.is_winner ? 'bg-brand-50 text-brand-600 border border-brand-200' : 'bg-surface-page text-ink-faint border border-surface-border'
                  }`}>
                    {t.round_status === 'open' ? <Clock size={18}/> : t.is_winner ? <Trophy size={18}/> : <Ticket size={18}/>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {t.round_status === 'open' ? 'Pending Draw' : t.is_winner ? 'Winner!' : 'No luck'}
                    </p>
                    <p className="text-[10px] text-ink-muted">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {t.round_status === 'completed' && t.is_winner && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-600">+{parseFloat(t.payout).toLocaleString()} ETB</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
