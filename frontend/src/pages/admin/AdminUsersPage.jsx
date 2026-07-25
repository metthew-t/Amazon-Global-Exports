import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await api.get('/admin/users')).data,
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ id, amount }) => (await api.post(`/admin/users/${id}/adjust-balance`, { amount })).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast({ title: 'Balance adjusted', type: 'success' });
    },
  });

  const resetPwdMutation = useMutation({
    mutationFn: async ({ id, newPassword }) => (await api.post(`/admin/users/${id}/reset-password`, { newPassword })).data,
    onSuccess: () => toast({ title: 'Password reset successful', type: 'success' }),
  });

  const filtered = users?.filter(u => 
    u.phone.includes(searchTerm) || u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || u.referral_code.includes(searchTerm.toUpperCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-white">Manage Users</h1>
        <input 
          type="text" 
          placeholder="Search phone, name, code..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Ref Code</th>
              <th className="p-3">Balance (ETB)</th>
              <th className="p-3">Bank Details</th>
              <th className="p-3">Joined</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr> : null}
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-800/50">
                <td className="p-3 font-medium text-gray-200">{u.full_name}</td>
                <td className="p-3 font-mono">{u.phone}</td>
                <td className="p-3 font-mono text-sky-400">{u.referral_code}</td>
                <td className="p-3 font-mono font-bold text-green-400">{parseFloat(u.balance).toLocaleString()}</td>
                <td className="p-3 text-xs">
                  {u.bank_type ? (
                    <div><span className="text-sky-400 font-bold">{u.bank_type}</span><br/>{u.account_number}<br/><span className="text-gray-500">{u.account_name}</span></div>
                  ) : <span className="text-gray-600">Not set</span>}
                </td>
                <td className="p-3 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right space-x-2">
                  <button 
                    onClick={() => {
                      const amt = window.prompt(`Adjust balance for ${u.full_name} (use negative to deduct):`, '0');
                      if (amt && !isNaN(amt)) adjustMutation.mutate({ id: u.id, amount: parseFloat(amt) });
                    }}
                    className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-white"
                  >
                    Adjust +/-
                  </button>
                  <button 
                    onClick={() => {
                      const pwd = window.prompt(`Enter new password for ${u.full_name}:`);
                      if (pwd && pwd.length >= 4) resetPwdMutation.mutate({ id: u.id, newPassword: pwd });
                    }}
                    className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-2 py-1 rounded"
                  >
                    Reset PWD
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
