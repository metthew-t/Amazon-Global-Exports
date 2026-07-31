import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
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
    <div className="min-h-screen flex items-center justify-center bg-surface-page p-4">
      <div className="u-card-brand w-full max-w-md animate-fade-in relative overflow-hidden border-brand-200">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-brand-500/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Join Amazon Global Exports</h1>
          <p className="text-sm text-ink-muted mt-1">Start earning premium daily returns</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
          <div>
            <label className="u-label">Full Name</label>
            <input type="text" {...register('fullName')} className="u-input" placeholder="e.g. John Doe" />
            {errors.fullName && <p className="u-form-error">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="u-label">Phone Number</label>
            <input type="tel" {...register('phone')} className="u-input" placeholder="0900000000" />
            {errors.phone && <p className="u-form-error">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="u-label">Password</label>
            <input type="password" {...register('password')} className="u-input" placeholder="••••••••" />
            {errors.password && <p className="u-form-error">{errors.password.message}</p>}
          </div>

          <div>
            <label className="u-label">Referral Code (Optional)</label>
            <input 
              type="text" 
              {...register('referralCode')} 
              className={`u-input ${refCode ? 'border-brand-500 text-brand-600 bg-brand-50' : ''}`}
              placeholder="Code" 
            />
            {refCode && <p className="text-xs text-brand-600 mt-1 font-medium">Referral code applied</p>}
          </div>

          <button type="submit" disabled={loading} className="u-btn-primary w-full mt-6 py-3 text-lg">
            {loading ? 'Creating Account...' : <><UserPlus size={20}/> Register Now</>}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
