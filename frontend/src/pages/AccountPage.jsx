import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast';
import { User, Landmark, Save, AlertTriangle } from 'lucide-react';

const schema = z.object({
  bankType: z.enum(['CBE', 'AWASH'], { required_error: 'Bank is required' }),
  accountNumber: z.string().min(5, 'Account number is too short'),
  accountName: z.string().min(2, 'Account name is required'),
});

export default function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: accountInfo, isLoading } = useQuery({
    queryKey: ['withdrawalAccount'],
    queryFn: async () => (await api.get('/withdrawals/account')).data,
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    values: accountInfo || { bankType: 'CBE', accountNumber: '', accountName: '' } // auto populate if exists
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => (await api.put('/withdrawals/account', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['withdrawalAccount']);
      toast({ title: 'Account Saved', description: 'Withdrawal details updated successfully.', type: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Save failed', description: err.response?.data?.message || 'Error', type: 'error' });
    }
  });

  if (isLoading) return <div className="text-center py-10 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header flex items-center gap-2"><User size={24} /> Account Settings</h1>
        <p className="page-sub">Manage your profile and withdrawal information</p>
      </div>

      <div className="card">
        <h2 className="section-title">Profile Information</h2>
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-500 text-sm">Name</span>
            <span className="text-white font-medium">{user?.full_name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-500 text-sm">Phone</span>
            <span className="text-white font-medium">{user?.phone}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-500 text-sm">Member Since</span>
            <span className="text-white font-medium">{new Date(user?.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="card-gold">
        <div className="flex items-center gap-2 mb-4">
          <Landmark size={20} className="text-sky-400" />
          <h2 className="text-lg font-serif text-white">Withdrawal Account</h2>
        </div>
        
        {!accountInfo && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 mb-5">
            <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200 leading-relaxed">
              You haven't set up a withdrawal account yet. Please add your bank details to enable withdrawals. Make sure the account name matches your registered name.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Bank Name</label>
            <select {...register('bankType')} className="input appearance-none">
              <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
              <option value="AWASH">Awash Bank</option>
            </select>
            {errors.bankType && <p className="form-error">{errors.bankType.message}</p>}
          </div>

          <div>
            <label className="label">Account Number</label>
            <input type="text" {...register('accountNumber')} className="input font-mono" placeholder="e.g. 1000..." />
            {errors.accountNumber && <p className="form-error">{errors.accountNumber.message}</p>}
          </div>

          <div>
            <label className="label">Account Holder Name</label>
            <input type="text" {...register('accountName')} className="input" placeholder="Full name on account" />
            {errors.accountName && <p className="form-error">{errors.accountName.message}</p>}
          </div>

          <button type="submit" disabled={saveMutation.isPending} className="btn-primary w-full mt-2">
            {saveMutation.isPending ? 'Saving...' : <><Save size={18}/> Save Bank Details</>}
          </button>
        </form>
      </div>
    </div>
  );
}
