import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { ArrowUpCircle, Clock, AlertTriangle, Settings, CalendarX, Zap } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WithdrawPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('withdraw');

  const { data: summary } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data,
  });

  const { data: accountInfo } = useQuery({
    queryKey: ['withdrawalAccount'],
    queryFn: async () => (await api.get('/withdrawals/account')).data,
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => (await api.get('/withdrawals')).data,
  });

  const { data: withdrawSettings } = useQuery({
    queryKey: ['withdrawalSettings'],
    queryFn: async () => (await api.get('/withdrawals/settings')).data,
  });

  const minWithdrawal = withdrawSettings?.minWithdrawal ?? 200;
  const quickAmounts = withdrawSettings?.quickAmounts ?? [];
  const allowedDays = withdrawSettings?.allowedDays ?? [1, 2, 3, 4, 5, 6];

  const todayIndex = new Date().getDay();
  const isTodayAllowed = allowedDays.includes(todayIndex);

  const nextAllowedDay = !isTodayAllowed && allowedDays.length > 0
    ? allowedDays.map(d => ({ d, diff: (d - todayIndex + 7) % 7 || 7 })).sort((a, b) => a.diff - b.diff)[0]
    : null;

  const schema = z.object({
    amount: z.number({ invalid_type_error: 'Amount must be a number' })
  }).superRefine((val, ctx) => {
    if (val.amount < minWithdrawal) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Minimum withdrawal is ${minWithdrawal} ETB`, path: ['amount'] });
    } else if (quickAmounts.length > 0 && !quickAmounts.includes(val.amount)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Amount must be exactly one of the quick select options`, path: ['amount'] });
    }
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data) => (await api.post('/withdrawals', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['withdrawals']);
      queryClient.invalidateQueries(['dashboardSummary']);
      toast({ title: 'Withdrawal Requested', description: 'Pending admin approval. Deducted from balance.', type: 'success' });
      reset();
      setActiveTab('history');
    },
    onError: (err) => {
      toast({ title: 'Request failed', description: err.response?.data?.message || 'Error', type: 'error' });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="u-page-header flex items-center gap-2"><ArrowUpCircle size={24} /> Withdraw</h1>
        <p className="u-page-sub">Withdraw your earnings to your bank account</p>
      </div>

      <div className="flex bg-white p-1 rounded-xl border border-surface-border">
        <button onClick={() => setActiveTab('withdraw')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'withdraw' ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-muted'}`}>
          New Withdrawal
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'history' ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-muted'}`}>
          History
        </button>
      </div>

      {activeTab === 'withdraw' ? (
        <div className="animate-fade-in space-y-6">
          
          <div className="u-card-brand bg-gradient-to-br from-brand-50 to-white flex justify-between items-center">
            <div>
              <p className="text-xs text-ink-muted mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-ink font-mono">{summary?.balance ? summary.balance.toLocaleString() : '0.00'} <span className="text-sm text-brand-600">ETB</span></p>
            </div>
          </div>

          {/* Blocked Day Banner */}
          {!isTodayAllowed && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
              <CalendarX size={22} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Withdrawals Not Available Today</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Today ({DAY_NAMES[todayIndex]}) is not a withdrawal day.
                  {nextAllowedDay
                    ? ` Come back on ${DAY_NAMES[nextAllowedDay.d]}.`
                    : ' No withdrawal days are currently configured.'}
                </p>
              </div>
            </div>
          )}

          {!accountInfo ? (
            <div className="u-card border-red-200 bg-red-50 text-center py-6">
              <AlertTriangle size={32} className="mx-auto text-red-500 mb-3" />
              <h3 className="text-ink font-semibold mb-2">No Bank Account Setup</h3>
              <p className="text-sm text-ink-muted mb-4">You must add a withdrawal bank account before you can request a withdrawal.</p>
              <Link to="/account" className="u-btn-primary"><Settings size={18}/> Setup Account</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit((d) => withdrawMutation.mutate(d))} className="space-y-5">
              
              <div className="u-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <label className="u-label m-0">Withdrawal Account</label>
                  <Link to="/account" className="text-xs text-brand-600 hover:underline flex items-center gap-1"><Settings size={12}/> Edit</Link>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-center font-bold text-brand-700 text-xs">{accountInfo.bankType}</div>
                  <div>
                    <p className="text-ink font-mono">{accountInfo.accountNumber}</p>
                    <p className="text-xs text-ink-muted">{accountInfo.accountName}</p>
                  </div>
                </div>
              </div>

              <div className="u-card">
                <div className="flex justify-between items-end mb-3">
                  <label className="u-label m-0">Amount to Withdraw</label>
                  <button type="button" onClick={() => setValue('amount', summary?.balance || 0, { shouldValidate: true })} className="text-[10px] text-brand-600 border border-brand-300 px-2 py-0.5 rounded-lg hover:bg-brand-50">MAX</button>
                </div>

                {/* Quick-fill amount buttons */}
                {quickAmounts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-ink-muted mb-2 flex items-center gap-1"><Zap size={10}/> Quick Select</p>
                    <div className="flex flex-wrap gap-2">
                      {quickAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setValue('amount', amt, { shouldValidate: true })}
                          disabled={amt < minWithdrawal || (summary?.balance ?? 0) < amt}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 hover:border-brand-400 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <input 
                    type="number" 
                    {...register('amount', { valueAsNumber: true })} 
                    className="u-input pl-4 pr-12 text-lg font-mono" 
                    placeholder={`${minWithdrawal}.00`} 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint font-bold">ETB</span>
                </div>
                {errors.amount && <p className="u-form-error">{errors.amount.message}</p>}
                
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-ink-muted flex items-center gap-1"><AlertTriangle size={12}/> Minimum withdrawal: {minWithdrawal.toLocaleString()} ETB</p>
                  <p className="text-xs text-ink-muted flex items-center gap-1"><Clock size={12}/> Allowed once every {withdrawSettings?.cooldownHours ?? 24} hours</p>
                  {allowedDays.length > 0 && (
                    <p className="text-xs text-ink-muted flex items-center gap-1">
                      <CalendarX size={12}/> Available days: {allowedDays.map(d => DAY_NAMES[d].slice(0, 3)).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={withdrawMutation.isPending || !isTodayAllowed || !summary?.balance || summary.balance < minWithdrawal}
                className="u-btn-primary w-full py-3.5 text-lg"
              >
                {withdrawMutation.isPending ? 'Processing...' : !isTodayAllowed ? 'Not Available Today' : 'Request Withdrawal'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="animate-fade-in space-y-3">
          {isLoading ? (
            <p className="text-center text-ink-muted py-10">Loading history...</p>
          ) : history?.length === 0 ? (
            <p className="text-center text-ink-muted py-10">No withdrawals found.</p>
          ) : (
            history.map((w) => (
              <div key={w.id} className="u-card p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">{w.bank_type}</span>
                    <span className={`u-badge-${w.status}`}>{w.status.toUpperCase()}</span>
                  </div>
                  <p className="font-bold text-red-500 font-mono">-{parseFloat(w.amount).toLocaleString()} ETB</p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-ink-muted font-mono">{w.account_number}</p>
                    <p className="text-[10px] text-ink-faint flex items-center gap-1 mt-1">
                      <Clock size={10}/> {new Date(w.created_at).toLocaleString()}
                    </p>
                  </div>
                  {w.admin_note && <p className="text-[10px] text-red-500 max-w-[50%] text-right bg-red-50 border border-red-200 p-1 rounded">Reason: {w.admin_note}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
