import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { Users, Copy, CheckCircle, Share2, Trophy } from 'lucide-react';

export default function NetworkPage() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('team'); // team | leaderboard

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
        <h1 className="page-header flex items-center gap-2"><Users size={24} /> Network</h1>
        <p className="page-sub">Invite friends and earn team rewards</p>
      </div>

      <div className="card-gold bg-gradient-to-br from-gray-900 to-gray-800 border-sky-500/20 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Your Referral Link</p>
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 flex items-center justify-between mb-4">
          <p className="font-mono text-sm text-sky-400 truncate">
            {teamData?.referralCode ? `${window.location.origin}/register?ref=${teamData.referralCode}` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyLink} className="btn-primary flex-1">
            {copied ? <CheckCircle size={18}/> : <Copy size={18}/>} Copy Link
          </button>
          <button onClick={shareLink} className="btn-outline">
            <Share2 size={18}/>
          </button>
        </div>
      </div>

      <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
        <button onClick={() => setActiveTab('team')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${activeTab === 'team' ? 'bg-gray-800 text-sky-400' : 'text-gray-400'}`}>
          <Users size={16}/> My Team ({teamData?.teamSize || 0})
        </button>
        <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${activeTab === 'leaderboard' ? 'bg-gray-800 text-sky-400' : 'text-gray-400'}`}>
          <Trophy size={16}/> Leaderboard
        </button>
      </div>

      {activeTab === 'team' ? (
        <div className="animate-fade-in space-y-3">
          {teamLoading ? (
            <p className="text-center text-gray-500 py-10">Loading team...</p>
          ) : teamData?.team.length === 0 ? (
            <div className="card border-dashed border-gray-700 text-center py-8">
              <Users size={32} className="mx-auto text-gray-600 mb-2"/>
              <p className="text-gray-400 text-sm">You haven't invited anyone yet.</p>
            </div>
          ) : (
            teamData.team.map(member => (
              <div key={member.id} className="card p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-500/20">
                    <UserIcon size={20} className="text-sky-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-200 text-sm">{member.full_name}</p>
                    <p className="text-[10px] text-gray-500">Joined: {new Date(member.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="animate-fade-in space-y-2">
          {lbLoading ? (
            <p className="text-center text-gray-500 py-10">Loading leaderboard...</p>
          ) : (
            leaderboard?.map((u, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                i === 0 ? 'bg-yellow-900/20 border-yellow-500/30' :
                i === 1 ? 'bg-gray-300/10 border-gray-400/30' :
                i === 2 ? 'bg-amber-700/10 border-amber-600/30' : 'bg-gray-900 border-gray-800'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm ${
                  i === 0 ? 'bg-yellow-500 text-gray-950 shadow-[0_0_10px_rgba(14,165,233,0.5)]' :
                  i === 1 ? 'bg-gray-300 text-gray-950' :
                  i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate text-sm ${i < 3 ? 'text-white' : 'text-gray-300'}`}>{u.full_name}</p>
                  <p className="text-[10px] text-gray-500">Code: {u.referral_code}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-sky-400">{u.team_size}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Members</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Inline UserIcon to avoid importing from lucide-react if missed
function UserIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
