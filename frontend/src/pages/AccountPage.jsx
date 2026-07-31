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

  if (isLoading) return <div className="text-center py-10 text-ink-muted">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="u-page-header flex items-center gap-2"><User size={24} /> Account Settings</h1>
        <p className="u-page-sub">Manage your profile and withdrawal information</p>
      </div>

      <div className="u-card">
        <h2 className="u-section-title">Profile Information</h2>
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center py-2 border-b border-surface-border">
            <span className="text-ink-muted text-sm">Name</span>
            <span className="text-ink font-medium">{user?.full_name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-surface-border">
            <span className="text-ink-muted text-sm">Phone</span>
            <span className="text-ink font-medium">{user?.phone}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-surface-border">
            <span className="text-ink-muted text-sm">Member Since</span>
            <span className="text-ink font-medium">{new Date(user?.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="u-card-brand">
        <div className="flex items-center gap-2 mb-4">
          <Landmark size={20} className="text-brand-600" />
          <h2 className="text-lg font-bold text-ink">Withdrawal Account</h2>
        </div>
        
        {!accountInfo && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-3 mb-5">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              You haven't set up a withdrawal account yet. Please add your bank details to enable withdrawals. Make sure the account name matches your registered name.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="u-label">Bank Name</label>
            <select {...register('bankType')} className="u-input appearance-none bg-surface-input">
              <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
              <option value="AWASH">Awash Bank</option>
            </select>
            {errors.bankType && <p className="u-form-error">{errors.bankType.message}</p>}
          </div>

          <div>
            <label className="u-label">Account Number</label>
            <input type="text" {...register('accountNumber')} className="u-input font-mono" placeholder="e.g. 1000..." />
            {errors.accountNumber && <p className="u-form-error">{errors.accountNumber.message}</p>}
          </div>

          <div>
            <label className="u-label">Account Holder Name</label>
            <input type="text" {...register('accountName')} className="u-input" placeholder="Full name on account" />
            {errors.accountName && <p className="u-form-error">{errors.accountName.message}</p>}
          </div>

          <button type="submit" disabled={saveMutation.isPending} className="u-btn-primary w-full mt-2 py-3 text-base">
            {saveMutation.isPending ? 'Saving...' : <><Save size={18}/> Save Bank Details</>}
          </button>
        </form>
      </div>
    </div>
  );
}
