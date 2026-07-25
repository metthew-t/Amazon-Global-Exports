import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ShieldCheck, UserPlus } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(9, 'Valid phone number is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  referralCode: z.string().optional(),
});

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { referralCode: refCode }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data);
      toast({ title: 'Registration successful!', type: 'success' });
      navigate('/dashboard');
    } catch (err) {
      toast({ title: 'Registration failed', description: err.response?.data?.message || 'Error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="card-gold w-full max-w-md animate-fade-in relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-sky-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-sky-500/20">
            <ShieldCheck size={32} className="text-gray-950" />
          </div>
          <h1 className="text-2xl font-serif text-sky-400">Join Amazon Global Exports</h1>
          <p className="text-sm text-gray-400 mt-1">Start earning premium daily returns</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
          <div>
            <label className="label">Full Name</label>
            <input type="text" {...register('fullName')} className="input" placeholder="e.g. John Doe" />
            {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
          </div>

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

          <div>
            <label className="label">Referral Code (Optional)</label>
            <input 
              type="text" 
              {...register('referralCode')} 
              className={`input ${refCode ? 'border-green-500/50 text-green-400 bg-green-500/5' : ''}`}
              placeholder="Code" 
            />
            {refCode && <p className="text-xs text-green-400 mt-1">Referral code applied</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-3 text-lg">
            {loading ? 'Creating Account...' : <><UserPlus size={20}/> Register Now</>}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-sky-400 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
