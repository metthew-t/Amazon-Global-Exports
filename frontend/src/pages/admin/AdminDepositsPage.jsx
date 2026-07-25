import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminDepositsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: deposits, isLoading } = useQuery({
    queryKey: ['adminDeposits'],
    queryFn: async () => (await api.get('/admin/deposits')).data,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, note }) => (await api.post(`/admin/deposits/${id}/${action}`, { note })).data,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['adminDeposits']);
      queryClient.invalidateQueries(['adminDashboard']);
      toast({ title: `Deposit ${variables.action}d`, type: variables.action === 'approve' ? 'success' : 'default' });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-white">Manage Deposits</h1>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Bank</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Transaction ID</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr> : null}
            {deposits?.map(d => (
              <tr key={d.id} className="hover:bg-gray-800/50">
                <td className="p-3">
                  <p className="font-medium text-gray-200">{d.full_name}</p>
                  <p className="text-xs font-mono text-gray-500">{d.phone}</p>
                </td>
                <td className="p-3 font-bold text-sky-400">{d.bank_type}</td>
                <td className="p-3 font-bold font-mono text-green-400">{parseFloat(d.amount).toLocaleString()}</td>
                <td className="p-3 font-mono text-gray-300">{d.transaction_id}</td>
                <td className="p-3 text-xs text-gray-500">{new Date(d.created_at).toLocaleString()}</td>
                <td className="p-3"><span className={`badge-${d.status}`}>{d.status.toUpperCase()}</span></td>
                <td className="p-3 text-right space-x-2">
                  {d.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => {
                          if(window.confirm('Approve this deposit and add funds to user balance?')) {
                            actionMutation.mutate({ id: d.id, action: 'approve' });
                          }
                        }}
                        disabled={actionMutation.isPending}
                        className="text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-2 py-1 rounded inline-flex items-center gap-1"
                      >
                        <CheckCircle size={14}/> Approve
                      </button>
                      <button 
                        onClick={() => {
                          const note = window.prompt('Reason for rejection:');
                          if(note !== null) actionMutation.mutate({ id: d.id, action: 'reject', note });
                        }}
                        disabled={actionMutation.isPending}
                        className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded inline-flex items-center gap-1"
                      >
                        <XCircle size={14}/> Reject
                      </button>
                    </>
                  )}
                  {d.admin_note && <p className="text-[10px] text-gray-500 mt-1">{d.admin_note}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
