import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Trash2 } from 'lucide-react';

export default function AdminMeetingCodesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: codes, isLoading } = useQuery({
    queryKey: ['adminMeetingCodes'],
    queryFn: async () => (await api.get('/admin/meeting-codes')).data,
  });

  const { register, handleSubmit, reset } = useForm();

  const createMutation = useMutation({
    mutationFn: async (data) => (await api.post('/admin/meeting-codes', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['adminMeetingCodes']);
      toast({ title: 'Meeting code created', type: 'success' });
      reset();
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Error', type: 'error' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/meeting-codes/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['adminMeetingCodes']);
      toast({ title: 'Code deleted', type: 'success' });
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-white">Meeting Reward Codes</h1>

      <div className="card max-w-2xl border-sky-500/30">
        <h2 className="text-lg font-semibold text-white mb-4">Generate New Code</h2>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Code (e.g. VIP-MEETING-1)</label>
            <input type="text" {...register('code')} className="input uppercase" required />
          </div>
          <div>
            <label className="label">Reward Amount (ETB)</label>
            <input type="number" {...register('rewardAmount')} className="input" required />
          </div>
          <div>
            <label className="label">Max Uses (default 1)</label>
            <input type="number" {...register('maxUses')} className="input" defaultValue="1" required />
          </div>
          <div>
            <label className="label">Expires At (optional)</label>
            <input type="datetime-local" {...register('expiresAt')} className="input" />
          </div>
          <div className="col-span-2 flex justify-end">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">Generate Code</button>
          </div>
        </form>
      </div>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Reward</th>
              <th className="p-3">Uses</th>
              <th className="p-3">Expires</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr> : null}
            {codes?.map(c => (
              <tr key={c.id} className="hover:bg-gray-800/50">
                <td className="p-3 font-mono font-bold text-white">{c.code}</td>
                <td className="p-3 font-mono text-green-400">+{parseFloat(c.reward_amount).toLocaleString()}</td>
                <td className="p-3 text-gray-300">{c.used_count} / {c.max_uses}</td>
                <td className="p-3 text-xs text-gray-500">{c.expires_at ? new Date(c.expires_at).toLocaleString() : 'Never'}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { if(window.confirm('Delete this code?')) deleteMutation.mutate(c.id); }} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
