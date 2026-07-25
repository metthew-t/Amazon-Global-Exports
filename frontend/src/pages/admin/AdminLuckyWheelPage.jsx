import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Star, RotateCw } from 'lucide-react';

export default function AdminLuckyWheelPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: rounds, isLoading } = useQuery({
    queryKey: ['adminWheelRounds'],
    queryFn: async () => (await api.get('/admin/lucky-wheel/rounds')).data,
  });

  const drawMutation = useMutation({
    mutationFn: async () => (await api.post('/admin/lucky-wheel/draw')).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['adminWheelRounds']);
      toast({ title: 'Draw complete', description: `${data.winners} winners got ${data.perWinner} ETB each`, type: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Draw failed', description: err.response?.data?.message || 'Error', type: 'error' });
    }
  });

  const openRound = rounds?.find(r => r.status === 'open');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-white flex items-center gap-2"><Star size={24}/> Lucky Wheel Control</h1>
      </div>

      <div className="card-gold bg-gradient-to-r from-gray-900 to-gray-800 border-sky-500/30">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Current Open Round</h2>
            {openRound ? (
              <p className="text-gray-400 text-sm">
                Tickets Sold: <span className="font-bold text-white">{openRound.tickets_sold}</span> | 
                Pot: <span className="font-bold text-sky-400">{parseFloat(openRound.pot_amount).toLocaleString()} ETB</span>
              </p>
            ) : (
              <p className="text-gray-500 text-sm">No open round currently (starts automatically on first purchase)</p>
            )}
          </div>
          <button 
            onClick={() => { if(window.confirm('Force draw immediately? This will end the round and pick winners.')) drawMutation.mutate(); }}
            disabled={drawMutation.isPending || !openRound || openRound.tickets_sold === 0}
            className="btn-primary"
          >
            {drawMutation.isPending ? 'Drawing...' : <><RotateCw size={18}/> Force Draw Now</>}
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <h2 className="text-lg font-semibold text-white p-4 border-b border-gray-800">Round History (Last 50)</h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-3">Started</th>
              <th className="p-3">Completed</th>
              <th className="p-3">Tickets Sold</th>
              <th className="p-3">Total Pot</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr> : null}
            {rounds?.map(r => (
              <tr key={r.id} className="hover:bg-gray-800/50">
                <td className="p-3 text-xs text-gray-400">{new Date(r.started_at).toLocaleString()}</td>
                <td className="p-3 text-xs text-gray-400">{r.completed_at ? new Date(r.completed_at).toLocaleString() : '-'}</td>
                <td className="p-3 text-gray-200">{r.tickets_sold}</td>
                <td className="p-3 font-bold font-mono text-sky-400">{parseFloat(r.pot_amount).toLocaleString()}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${r.status === 'open' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
