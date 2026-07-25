import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export default function AdminActiveUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['adminActiveUsers'],
    queryFn: async () => (await api.get('/admin/active-users')).data,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-white">Active Users (Investors)</h1>
      <p className="text-gray-400 text-sm">Users sorted by number of active products and balance.</p>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-3">Rank</th>
              <th className="p-3">User</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Balance</th>
              <th className="p-3 text-sky-400">Active Products</th>
              <th className="p-3">Team Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr> : null}
            {users?.map((u, i) => (
              <tr key={u.id} className="hover:bg-gray-800/50">
                <td className="p-3 font-bold text-gray-500">#{i+1}</td>
                <td className="p-3 font-medium text-white">{u.full_name}</td>
                <td className="p-3 font-mono text-gray-400">{u.phone}</td>
                <td className="p-3 font-mono text-green-400">{parseFloat(u.balance).toLocaleString()} ETB</td>
                <td className="p-3 font-bold text-sky-400">{u.active_products}</td>
                <td className="p-3 text-gray-300">{u.team_size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
