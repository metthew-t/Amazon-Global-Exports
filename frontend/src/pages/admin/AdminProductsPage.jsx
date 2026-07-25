import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Edit2, Trash2, Plus } from 'lucide-react';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editingProd, setEditingProd] = useState(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: async () => (await api.get('/admin/products')).data,
  });

  const { register, handleSubmit, reset } = useForm();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingProd?.id) return (await api.put(`/admin/products/${editingProd.id}`, data)).data;
      return (await api.post('/admin/products', data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      toast({ title: 'Product saved', type: 'success' });
      setEditingProd(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/products/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      toast({ title: 'Product deactivated', type: 'success' });
    }
  });

  const onSubmit = (d) => {
    saveMutation.mutate({
      name: d.name,
      level: parseInt(d.level),
      price: parseFloat(d.price),
      daily_return: parseFloat(d.daily_return),
      duration_days: parseInt(d.duration_days),
      is_active: d.is_active === 'true' || d.is_active === true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-white">VIP Products</h1>
        <button 
          onClick={() => { reset({ is_active: true, duration_days: 30 }); setEditingProd({}); }}
          className="btn-primary py-2 text-sm"
        >
          <Plus size={16}/> New Product
        </button>
      </div>

      {editingProd !== null && (
        <div className="card border-sky-500/30">
          <h2 className="text-lg font-semibold text-white mb-4">{editingProd.id ? 'Edit' : 'Add'} Product</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Product Name</label>
              <input type="text" {...register('name')} defaultValue={editingProd.name} className="input" required />
            </div>
            <div>
              <label className="label">VIP Level (1-15)</label>
              <input type="number" {...register('level')} defaultValue={editingProd.level} className="input" required min="1" max="15"/>
            </div>
            <div>
              <label className="label">Price (ETB)</label>
              <input type="number" {...register('price')} defaultValue={editingProd.price} className="input" required step="0.01"/>
            </div>
            <div>
              <label className="label">Daily Return (ETB)</label>
              <input type="number" {...register('daily_return')} defaultValue={editingProd.daily_return} className="input" required step="0.01"/>
            </div>
            <div>
              <label className="label">Duration (Days)</label>
              <input type="number" {...register('duration_days')} defaultValue={editingProd.duration_days} className="input" required />
            </div>
            <div>
              <label className="label">Active</label>
              <select {...register('is_active')} defaultValue={editingProd.id ? editingProd.is_active : true} className="input">
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setEditingProd(null)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary">Save Product</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-3">Level</th>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Daily Return</th>
              <th className="p-3">Total Expected</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr> : null}
            {products?.map(p => (
              <tr key={p.id} className={`hover:bg-gray-800/50 ${!p.is_active ? 'opacity-50' : ''}`}>
                <td className="p-3 font-bold text-sky-400">{p.level}</td>
                <td className="p-3 font-medium text-white">{p.name}</td>
                <td className="p-3 font-mono">{parseFloat(p.price).toLocaleString()}</td>
                <td className="p-3 font-mono text-green-400">+{parseFloat(p.daily_return).toLocaleString()}</td>
                <td className="p-3 font-mono text-sky-400">{(p.daily_return * p.duration_days).toLocaleString()}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${p.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => { reset(); setEditingProd(p); }} className="text-gray-400 hover:text-white p-1"><Edit2 size={16}/></button>
                  {p.is_active && <button onClick={() => { if(window.confirm('Deactivate?')) deleteMutation.mutate(p.id); }} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16}/></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
