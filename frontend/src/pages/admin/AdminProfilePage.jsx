import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { User, Lock } from 'lucide-react';

const schema = z.object({
  phone: z.string().min(1, 'Admin ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  password: z.string().optional(),
});

export default function AdminProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: user?.phone || '',
      fullName: user?.full_name || '',
      password: '',
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.put('/admin/profile', data);
      toast({ title: 'Profile updated successfully', type: 'success' });
      setUser({ ...user, full_name: data.fullName, phone: data.phone });
    } catch (err) {
      toast({ title: 'Update failed', description: err.response?.data?.message || 'Error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-serif text-white">Admin Profile</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label flex items-center gap-2"><User size={16} /> Admin Login ID</label>
            <input type="text" {...register('phone')} className="input" placeholder="admin" />
            <p className="text-xs text-gray-500 mt-1">This is what you type into the Phone Number box to log in.</p>
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label flex items-center gap-2"><User size={16} /> Display Name</label>
            <input type="text" {...register('fullName')} className="input" placeholder="Admin Name" />
            {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="label flex items-center gap-2"><Lock size={16} /> New Password</label>
            <input type="password" {...register('password')} className="input" placeholder="Leave blank to keep current password" />
            <p className="text-xs text-gray-500 mt-1">If you don't want to change your password, just leave this blank.</p>
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
