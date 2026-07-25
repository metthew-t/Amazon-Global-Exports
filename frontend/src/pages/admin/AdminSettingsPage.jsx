import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => (await api.get('/admin/settings')).data,
  });

  const { register, handleSubmit } = useForm({
    values: settings ? Object.fromEntries(Object.entries(settings).map(([k,v]) => [k, v.value])) : {}
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => (await api.put('/admin/settings', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['adminSettings']);
      toast({ title: 'Settings saved', type: 'success' });
    }
  });

  if (isLoading) return <div className="text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-serif text-white">Global Settings</h1>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-6">
        
        {/* Toggles */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Features & Toggles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['daily_reward_enabled', 'meeting_reward_enabled', 'team_reward_enabled', 'lucky_wheel_enabled', 'new_member_bonus_enabled', 'invitation_reward_enabled'].map(key => (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-950 rounded-lg border border-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-200">{settings?.[key]?.description || key}</p>
                </div>
                <select {...register(key)} className="input w-24 py-1.5">
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Deposit Bank Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['bank_cbe_account', 'bank_cbe_name', 'bank_boa_account', 'bank_boa_name', 'bank_awash_account', 'bank_awash_name'].map(key => (
              <div key={key}>
                <label className="label">{settings?.[key]?.description || key}</label>
                <input type="text" {...register(key)} className="input font-mono" />
              </div>
            ))}
          </div>
        </div>

        {/* Support Links */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Support Links (Telegram)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Telegram Group Link</label>
              <input type="text" {...register('telegram_group_link')} className="input" placeholder="https://t.me/..." />
            </div>
            <div>
              <label className="label">Telegram Manager Link</label>
              <input type="text" {...register('telegram_manager_link')} className="input" placeholder="https://t.me/..." />
            </div>
          </div>
        </div>

        {/* Withdrawal Configuration */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Withdrawal Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Min Amount (ETB)</label>
              <input type="number" {...register('min_withdrawal')} className="input" />
            </div>
            <div>
              <label className="label">Cooldown (Hours)</label>
              <input type="number" {...register('withdrawal_cooldown_hours')} className="input" />
            </div>
            <div>
              <label className="label">Start Time (EAT)</label>
              <input type="time" {...register('withdrawal_start_time')} className="input" />
            </div>
            <div>
              <label className="label">End Time (EAT)</label>
              <input type="time" {...register('withdrawal_end_time')} className="input" />
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Lucky Wheel Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['lucky_wheel_ticket_price', 'lucky_wheel_max_participants', 'lucky_wheel_num_winners', 'lucky_wheel_payout_percentage'].map(key => (
              <div key={key}>
                <label className="label truncate" title={settings?.[key]?.description}>{settings?.[key]?.description}</label>
                <input type="number" {...register(key)} className="input" step="any" />
              </div>
            ))}
          </div>
        </div>

        {/* First Deposit Bonuses */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">New Member Bonus</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">New Member Min Bonus %</label>
              <input type="number" {...register('new_member_bonus_min_percent')} className="input" step="0.1" />
            </div>
            <div>
              <label className="label">New Member Max Bonus %</label>
              <input type="number" {...register('new_member_bonus_max_percent')} className="input" step="0.1" />
            </div>
          </div>
        </div>

        {/* Invitation Rewards Configuration */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Invitation Rewards (Per VIP Level Purchased)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={`inv_${i + 1}`}>
                <label className="label">VIP {i + 1} Invite Bonus</label>
                <input type="number" {...register(`invite_reward_vip_${i + 1}`)} className="input" />
              </div>
            ))}
          </div>
        </div>

        {/* Team Rewards Configuration */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">Team Rewards Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['a', 'b', 'c'].map(level => (
              <div key={level} className="space-y-2 p-3 bg-gray-950 rounded border border-gray-800">
                <h3 className="text-md font-medium text-gold uppercase">Level {level}</h3>
                <div>
                  <label className="label">Min Members</label>
                  <input type="number" {...register(`team_reward_min_${level}`)} className="input" />
                </div>
                <div>
                  <label className="label">Reward Amount</label>
                  <input type="number" {...register(`team_reward_amount_${level}`)} className="input" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIP Upgrade Rewards Configuration */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">VIP Upgrade Rewards</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i + 1}>
                <label className="label">VIP {i + 1} Bonus</label>
                <input type="number" {...register(`upgrade_reward_vip_${i + 1}`)} className="input" />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saveMutation.isPending} className="btn-primary w-full py-3">
          {saveMutation.isPending ? 'Saving...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  );
}
