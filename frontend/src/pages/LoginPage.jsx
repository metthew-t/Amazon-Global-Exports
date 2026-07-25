import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { LogIn } from 'lucide-react';

const schema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.phone, data.password);
      toast({ title: 'Welcome back!', type: 'success' });
      navigate('/dashboard');
    } catch (err) {
      toast({ title: 'Login failed', description: err.response?.data?.message || 'Invalid credentials', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="card-gold w-full max-w-md animate-fade-in relative overflow-hidden">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-sky-400">Member Login</h1>
          <p className="text-sm text-gray-400 mt-1">Access your Amazon Global Exports account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Phone Number</label>
            <input type="tel" {...register('phone')} className="input" placeholder="0900000000" />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input type="password" {...register('password')} className="input" placeholder="••••••••" />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-3 text-lg">
            {loading ? 'Logging in...' : <><LogIn size={20}/> Login</>}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <Link to="/register" className="text-sky-400 font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
