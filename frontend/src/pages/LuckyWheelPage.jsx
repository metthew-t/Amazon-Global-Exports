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

  if (isLoading) return <div className="text-center py-10 text-gray-500">Loading wheel...</div>;

  if (wheelData?.disabled) {
    return (
      <div className="text-center py-20">
        <Star size={48} className="mx-auto text-gray-700 mb-4" />
        <h2 className="text-xl text-gray-500 font-serif">Lucky Wheel is currently closed</h2>
        <p className="text-sm text-gray-600 mt-2">Check back later for the next round!</p>
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-500/20 border border-sky-500/30 mb-4 animate-pulse-sky relative">
          <Star size={32} className="text-sky-400" />
        </div>
        <h1 className="text-2xl font-serif text-sky-400 mb-1">Lucky Wheel</h1>
        <p className="text-sm text-gray-400">Buy a ticket for a chance to win the pot!</p>
      </div>

      <div className="card-gold relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950 border-sky-500/30">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Star size={120} />
        </div>
        
        <div className="relative z-10 text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Current Pot Amount</p>
          <p className="text-4xl font-bold text-white font-mono tracking-tight">
            {r?.pot_amount ? parseFloat(r.pot_amount).toLocaleString() : '0'} <span className="text-lg text-sky-500">ETB</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="bg-gray-950 rounded-lg p-2 border border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase">Ticket Price</p>
            <p className="text-sm font-bold text-sky-400">{price} ETB</p>
          </div>
          <div className="bg-gray-950 rounded-lg p-2 border border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase">Winners</p>
            <p className="text-sm font-bold text-sky-400">{wheelData?.numWinners}</p>
          </div>
          <div className="bg-gray-950 rounded-lg p-2 border border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase">Your Tickets</p>
            <p className="text-sm font-bold text-sky-400">{userTickets}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">Tickets Sold</span>
            <span className="text-sky-400 font-mono">{sold} / {max}</span>
          </div>
          <div className="w-full bg-gray-950 rounded-full h-3 border border-gray-800 overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full transition-all duration-1000 relative"
              style={{ width: `${(sold / max) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[slideRight_2s_infinite]"></div>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-500 mt-2">Draw happens when {max} tickets are sold</p>
        </div>

        <button 
          onClick={() => {
            if (window.confirm(`Buy a ticket for ${price} ETB?`)) buyMutation.mutate();
          }}
          disabled={buyMutation.isPending || sold >= max}
          className="btn-primary w-full py-4 text-lg font-bold"
        >
          {buyMutation.isPending ? 'Processing...' : sold >= max ? 'Round Full - Drawing...' : <><Ticket size={20}/> Buy Ticket</>}
        </button>
      </div>

      <div>
        <h2 className="section-title">Your Ticket History</h2>
        <div className="space-y-3">
          {history?.length === 0 ? (
            <p className="text-center text-sm text-gray-600 py-4">No tickets purchased yet</p>
          ) : (
            history?.map((t) => (
              <div key={t.id} className="card p-3 flex justify-between items-center border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    t.round_status === 'open' ? 'bg-blue-500/10 text-blue-400' :
                    t.is_winner ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {t.round_status === 'open' ? <Clock size={18}/> : t.is_winner ? <Trophy size={18}/> : <Ticket size={18}/>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-200">
                      {t.round_status === 'open' ? 'Pending Draw' : t.is_winner ? 'Winner!' : 'No luck'}
                    </p>
                    <p className="text-[10px] text-gray-500">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {t.round_status === 'completed' && t.is_winner && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">+{parseFloat(t.payout).toLocaleString()} ETB</p>
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
