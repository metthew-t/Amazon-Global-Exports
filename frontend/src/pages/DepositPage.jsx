import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { ArrowDownCircle, Copy, CheckCircle, Clock, MessageCircle, X, Send } from 'lucide-react';

const FALLBACK_MANAGER_LINK = 'https://t.me/AGEs1122';

function resolveManagerLink(apiValue) {
  if (apiValue && typeof apiValue === 'string') {
    const trimmed = apiValue.trim();
    if (trimmed && trimmed !== '#' && !trimmed.includes('your_manager_link')) {
      return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    }
  }
  return FALLBACK_MANAGER_LINK;
}

const statusBadgeClass = {
  pending: 'u-badge-pending',
  approved: 'u-badge-approved',
  rejected: 'u-badge-rejected',
};

const schema = z.object({
  bankType: z.enum(['CBE', 'AWASH'], { required_error: 'Please select a bank' }),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).min(100, 'Minimum deposit is 100 ETB'),
  transactionId: z.string()
    .min(5, 'Transaction ID must be at least 5 characters')
}).superRefine((data, ctx) => {
  if (data.bankType === 'CBE') {
    if (!/^FT[a-zA-Z0-9]+$/i.test(data.transactionId)) {
      ctx.addIssue({ path: ['transactionId'], code: z.ZodIssueCode.custom, message: 'CBE Transaction ID must start with FT and contain only letters and numbers' });
    }
  } else {
    if (!/^[a-zA-Z0-9]+$/.test(data.transactionId)) {
      ctx.addIssue({ path: ['transactionId'], code: z.ZodIssueCode.custom, message: `${data.bankType} Transaction ID must contain only letters and numbers` });
    }
  }
});

// Fallback bank accounts (used if API is unavailable)
const FALLBACK_BANKS = {
  CBE: { name: 'Commercial Bank of Ethiopia (CBE)', account: '1000540699236' },
  AWASH: { name: 'Awash Bank', account: '013351516497900' },
};

export default function DepositPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('deposit');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: supportLinks } = useQuery({
    queryKey: ['supportLinks'],
    queryFn: async () => (await api.get('/dashboard/support')).data,
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ['depositBanks'],
    queryFn: async () => (await api.get('/dashboard/deposit-banks')).data,
  });

  const banks = bankAccounts || FALLBACK_BANKS;

  const { data: history, isLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn: async () => (await api.get('/deposits')).data,
  });

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { bankType: 'CBE' }
  });
  
  const selectedBank = watch('bankType');

  const depositMutation = useMutation({
    mutationFn: async (data) => (await api.post('/deposits', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['deposits']);
      reset();
      setShowSuccessModal(true);
    },
    onError: (err) => {
      toast({ title: 'Submission failed', description: err.response?.data?.message || 'Error', type: 'error' });
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Account number copied!' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="u-page-header flex items-center gap-2"><ArrowDownCircle size={24} /> Deposit</h1>
        <p className="u-page-sub">Add funds to your Amazon Global Exports account</p>
      </div>

      <div className="flex bg-white p-1 rounded-xl border border-surface-border">
        <button 
          onClick={() => setActiveTab('deposit')} 
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'deposit' ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-muted'}`}
        >
          New Deposit
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'history' ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-muted'}`}
        >
          History
        </button>
      </div>

      {activeTab === 'deposit' ? (
        <div className="animate-fade-in space-y-6">
          <form onSubmit={handleSubmit((d) => depositMutation.mutate(d))} className="space-y-5">
            
            <div className="u-card-brand">
              <label className="u-label mb-3">1. Select Payment Bank</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(banks).map((bank) => (
                  <label key={bank} className={`
                    border rounded-xl p-3 text-center cursor-pointer transition-all
                    ${selectedBank === bank ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' : 'border-surface-border bg-surface-input text-ink-muted hover:border-brand-300'}
                  `}>
                    <input type="radio" value={bank} {...register('bankType')} className="hidden" />
                    <span className="font-bold text-sm block">{bank}</span>
                  </label>
                ))}
              </div>
              {errors.bankType && <p className="u-form-error">{errors.bankType.message}</p>}

              {selectedBank && banks[selectedBank] && (
                <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-200 text-center">
                  <p className="text-xs text-ink-muted mb-1">Transfer exact amount to:</p>
                  <p className="font-medium text-sm text-ink mb-2">{banks[selectedBank].name}</p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-2xl font-bold text-brand-700 font-mono tracking-wider">
                      {banks[selectedBank].account}
                    </p>
                    <button 
                      type="button" 
                      onClick={() => copyToClipboard(banks[selectedBank].account)}
                      className="p-2 bg-white hover:bg-brand-100 rounded-lg text-brand-600 transition-colors border border-brand-200"
                    >
                      {copied ? <CheckCircle size={18} className="text-brand-600" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="u-card">
              <label className="u-label">2. Enter Deposit Amount</label>
              <div className="relative">
                <input 
                  type="number" 
                  {...register('amount', { valueAsNumber: true })} 
                  className="u-input pl-4 pr-12 text-lg font-mono" 
                  placeholder="0.00" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint font-bold">ETB</span>
              </div>
              {errors.amount && <p className="u-form-error">{errors.amount.message}</p>}
            </div>

            <div className="u-card">
              <label className="u-label">3. Transaction ID / Reference</label>
              <p className="text-xs text-ink-muted mb-2">After transferring, enter the bank transaction ID here.</p>
              <input 
                type="text" 
                {...register('transactionId')} 
                className="u-input font-mono" 
                placeholder={selectedBank === 'CBE' ? 'e.g. FT2312345678' : 'e.g. AW9876543'}
              />
              {errors.transactionId && <p className="u-form-error">{errors.transactionId.message}</p>}
            </div>

            <button type="submit" disabled={depositMutation.isPending} className="u-btn-primary w-full py-3.5 text-lg">
              {depositMutation.isPending ? 'Submitting...' : 'Submit Deposit'}
            </button>
          </form>
        </div>
      ) : (
        <div className="animate-fade-in space-y-3">
          {isLoading ? (
            <p className="text-center text-ink-muted py-10">Loading history...</p>
          ) : history?.length === 0 ? (
            <p className="text-center text-ink-muted py-10">No deposits found.</p>
          ) : (
            history.map((dep) => (
              <div key={dep.id} className="u-card p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-ink">{dep.bank_type}</span>
                    <span className={statusBadgeClass[dep.status] || 'text-ink-muted text-xs'}>{dep.status.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-ink-muted font-mono">Ref: {dep.transaction_id}</p>
                  <p className="text-[10px] text-ink-faint flex items-center gap-1 mt-1">
                    <Clock size={10}/> {new Date(dep.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600">+{parseFloat(dep.amount).toLocaleString()} ETB</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white border border-surface-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-5 text-center relative">
            <button
              onClick={() => { setShowSuccessModal(false); setActiveTab('history'); }}
              className="absolute top-3 right-3 text-ink-faint hover:text-ink transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mx-auto w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-brand-600" />
            </div>

            <h2 className="text-xl font-bold text-ink">Deposit Submitted!</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Your deposit request has been received and is <span className="text-amber-600 font-semibold">pending approval</span>.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Send size={16} className="text-amber-600" />
                <p className="text-sm font-semibold text-amber-700">Action Required</p>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Please send a <span className="font-bold text-ink">screenshot</span> of your bank transaction to our manager on Telegram to get your deposit approved quickly.
              </p>
            </div>

            <a
              href={resolveManagerLink(supportLinks?.managerLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="u-btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              Send Screenshot to Manager
            </a>

            <button
              onClick={() => { setShowSuccessModal(false); setActiveTab('history'); }}
              className="text-xs text-ink-faint hover:text-ink transition-colors"
            >
              I'll do it later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
