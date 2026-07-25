import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['adminWithdrawals'],
    queryFn: async () => (await api.get('/admin/withdrawals')).data,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, note }) => (await api.post(`/admin/withdrawals/${id}/${action}`, { note })).data,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['adminWithdrawals']);
      queryClient.invalidateQueries(['adminDashboard']);
      toast({ title: `Withdrawal ${variables.action}d`, type: variables.action === 'approve' ? 'success' : 'default' });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-white">Manage Withdrawals</h1>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Bank Details</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr> : null}
            {withdrawals?.map(w => (
              <tr key={w.id} className="hover:bg-gray-800/50">
                <td className="p-3">
                  <p className="font-medium text-gray-200">{w.full_name}</p>
                  <p className="text-xs font-mono text-gray-500">{w.phone}</p>
                </td>
                <td className="p-3">
                  <span className="font-bold text-sky-400">{w.bank_type}</span>
                  <p className="font-mono text-gray-300">{w.account_number}</p>
                  <p className="text-xs text-gray-500">{w.account_name}</p>
                </td>
                <td className="p-3 font-bold font-mono text-red-400">{parseFloat(w.amount).toLocaleString()}</td>
                <td className="p-3 text-xs text-gray-500">{new Date(w.created_at).toLocaleString()}</td>
                <td className="p-3"><span className={`badge-${w.status}`}>{w.status.toUpperCase()}</span></td>
                <td className="p-3 text-right space-x-2">
                  {w.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => {
                          if(window.confirm('Approve this withdrawal? Did you transfer the funds to the user?')) {
                            actionMutation.mutate({ id: w.id, action: 'approve' });
                          }
                        }}
                        disabled={actionMutation.isPending}
                        className="text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-2 py-1 rounded inline-flex items-center gap-1"
                      >
                        <CheckCircle size={14}/> Approve
                      </button>
                      <button 
                        onClick={() => {
                          const note = window.prompt('Reason for rejection (funds will be returned to user balance):');
                          if(note !== null) actionMutation.mutate({ id: w.id, action: 'reject', note });
                        }}
                        disabled={actionMutation.isPending}
                        className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded inline-flex items-center gap-1"
                      >
                        <XCircle size={14}/> Reject
                      </button>
                    </>
                  )}
                  {w.admin_note && <p className="text-[10px] text-gray-500 mt-1">{w.admin_note}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
