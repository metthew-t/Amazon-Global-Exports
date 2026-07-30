import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast';
import { ShieldAlert } from 'lucide-react';

const schema = z.object({
  phone: z.string().min(1, 'Admin ID/Phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await adminLogin(data.phone, data.password);
      toast({ title: 'Admin access granted', type: 'success' });
      navigate('/admin/dashboard');
    } catch (err) {
      toast({ title: 'Access Denied', description: err.response?.data?.message || 'Invalid admin credentials', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="card border-red-500/20 w-full max-w-md animate-fade-in relative overflow-hidden">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-red-500/20">
            <ShieldAlert size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-serif text-white">Admin Portal</h1>
          <p className="text-sm text-red-400 mt-1">Owner Access Only</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Admin ID</label>
            <input type="text" {...register('phone')} className="input" placeholder="admin" />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input type="password" {...register('password')} className="input" placeholder="••••••••" />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn w-full mt-6 py-3 text-lg bg-red-600 text-white hover:bg-red-500">
            {loading ? 'Authenticating...' : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
