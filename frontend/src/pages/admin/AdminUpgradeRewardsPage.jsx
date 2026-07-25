import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminUpgradeRewardsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['adminUpgradeRewards'],
    queryFn: async () => (await api.get('/admin/upgrade-rewards')).data,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }) => (await api.post(`/admin/upgrade-rewards/${id}/${action}`)).data,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['adminUpgradeRewards']);
      toast({ title: `Reward ${variables.action}d`, type: variables.action === 'approve' ? 'success' : 'default' });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-white">VIP Upgrade Reward Requests</h1>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">VIP Level</th>
              <th className="p-3">Reward Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr> : null}
            {requests?.map(r => (
              <tr key={r.id} className="hover:bg-gray-800/50">
                <td className="p-3">
                  <p className="font-medium text-gray-200">{r.full_name}</p>
                  <p className="text-xs font-mono text-gray-500">{r.phone}</p>
                </td>
                <td className="p-3 font-bold text-sky-400">Level {r.vip_level}</td>
                <td className="p-3 font-bold font-mono text-green-400">+{parseFloat(r.amount).toLocaleString()}</td>
                <td className="p-3"><span className={`badge-${r.status}`}>{r.status.toUpperCase()}</span></td>
                <td className="p-3 text-right space-x-2">
                  {r.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => {
                          if(window.confirm('Approve this VIP upgrade reward?')) {
                            actionMutation.mutate({ id: r.id, action: 'approve' });
                          }
                        }}
                        disabled={actionMutation.isPending}
                        className="text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-2 py-1 rounded inline-flex items-center gap-1"
                      >
                        <CheckCircle size={14}/> Approve
                      </button>
                      <button 
                        onClick={() => {
                          if(window.confirm('Reject this reward?')) {
                            actionMutation.mutate({ id: r.id, action: 'reject' });
                          }
                        }}
                        disabled={actionMutation.isPending}
                        className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded inline-flex items-center gap-1"
                      >
                        <XCircle size={14}/> Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
