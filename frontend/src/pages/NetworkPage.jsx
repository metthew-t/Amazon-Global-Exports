import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { Users, Copy, CheckCircle, Share2, Trophy } from 'lucide-react';

export default function NetworkPage() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('team');

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['team'],
    queryFn: async () => (await api.get('/team')).data,
  });

  const { data: leaderboard, isLoading: lbLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => (await api.get('/team/leaderboard')).data,
  });

  const copyLink = () => {
    if (!teamData?.referralCode) return;
    const url = `${window.location.origin}/register?ref=${teamData.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Referral link copied!' });
  };

  const shareLink = async () => {
    if (!teamData?.referralCode) return;
    const url = `${window.location.origin}/register?ref=${teamData.referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Amazon Global Exports',
          text: 'Earn premium daily returns with me!',
          url: url,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="u-page-header flex items-center gap-2"><Users size={24} /> Network</h1>
        <p className="u-page-sub">Invite friends and earn team rewards</p>
      </div>

      <div className="u-card-brand bg-gradient-to-br from-brand-50 to-white text-center">
        <p className="text-xs text-ink-muted uppercase tracking-widest mb-1 font-semibold">Your Referral Link</p>
        <div className="bg-white border border-brand-200 rounded-xl p-3 flex items-center justify-between mb-4 shadow-sm">
          <p className="font-mono text-sm text-brand-700 truncate">
            {teamData?.referralCode ? `${window.location.origin}/register?ref=${teamData.referralCode}` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyLink} className="u-btn-primary flex-1">
            {copied ? <CheckCircle size={18}/> : <Copy size={18}/>} Copy Link
          </button>
          <button onClick={shareLink} className="u-btn-outline px-4">
            <Share2 size={18}/>
          </button>
        </div>
      </div>

      <div className="flex bg-white p-1 rounded-xl border border-surface-border">
        <button onClick={() => setActiveTab('team')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'team' ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-muted'}`}>
          <Users size={16}/> My Team ({teamData?.teamSize || 0})
        </button>
        <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'leaderboard' ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-muted'}`}>
          <Trophy size={16}/> Leaderboard
        </button>
      </div>

      {activeTab === 'team' ? (
        <div className="animate-fade-in space-y-3">
          {teamLoading ? (
            <p className="text-center text-ink-muted py-10">Loading team...</p>
          ) : teamData?.team.length === 0 ? (
            <div className="u-card border-dashed border-surface-border text-center py-8">
              <Users size={32} className="mx-auto text-ink-faint mb-2"/>
              <p className="text-ink-muted text-sm">You haven't invited anyone yet.</p>
            </div>
          ) : (
            teamData.team.map(member => (
              <div key={member.id} className="u-card p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center border border-brand-200">
                    <UserIcon size={20} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-bold text-ink text-sm">{member.full_name}</p>
                    <p className="text-[10px] text-ink-muted">Joined: {new Date(member.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="animate-fade-in space-y-2">
          {lbLoading ? (
            <p className="text-center text-ink-muted py-10">Loading leaderboard...</p>
          ) : (
            leaderboard?.map((u, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                i === 0 ? 'bg-amber-50 border-amber-200' :
                i === 1 ? 'bg-gray-50 border-gray-200' :
                i === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-surface-border'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm ${
                  i === 0 ? 'bg-amber-400 text-white shadow-[0_2px_10px_rgba(251,191,36,0.4)]' :
                  i === 1 ? 'bg-gray-300 text-white' :
                  i === 2 ? 'bg-orange-400 text-white' : 'bg-surface-page text-ink-muted'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate text-sm ${i < 3 ? 'text-ink' : 'text-ink-muted'}`}>{u.full_name}</p>
                  <p className="text-[10px] text-ink-faint">Code: {u.referral_code}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand-600">{u.team_size}</p>
                  <p className="text-[10px] text-ink-faint uppercase">Members</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function UserIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
