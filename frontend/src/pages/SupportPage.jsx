import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { MessageCircle, Users, ExternalLink } from 'lucide-react';

function openExternalLink(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return;
  let url = rawUrl.trim();
  if (!url || url === '#') return;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function SupportPage() {
  const { data: support, isLoading } = useQuery({
    queryKey: ['supportLinks'],
    queryFn: async () => (await api.get('/dashboard/support')).data,
  });

  if (isLoading) return <div className="text-center py-10 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header flex items-center gap-2"><MessageCircle size={24} /> Support</h1>
        <p className="page-sub">Get help or join our community on Telegram</p>
      </div>

      <div className="card-gold space-y-4">
        <a
          href={support?.managerLink && support.managerLink !== '#' ? (support.managerLink.startsWith('http') ? support.managerLink : `https://${support.managerLink}`) : '#'}
          target={support?.managerLink && support.managerLink !== '#' ? "_blank" : "_self"}
          rel="noopener noreferrer"
          onClick={(e) => { if (!support?.managerLink || support.managerLink === '#') e.preventDefault(); }}
          className="w-full flex items-center justify-between p-4 bg-gray-900 border border-sky-600/30 rounded-xl hover:bg-sky-500/10 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 rounded-lg text-sky-400 group-hover:scale-110 transition-transform">
              <MessageCircle size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-100">Contact Manager</h3>
              <p className="text-xs text-gray-400">Directly message our support manager</p>
            </div>
          </div>
          <ExternalLink size={20} className="text-gray-500 group-hover:text-sky-400 transition-colors" />
        </a>

        <a
          href={support?.groupLink && support.groupLink !== '#' ? (support.groupLink.startsWith('http') ? support.groupLink : `https://${support.groupLink}`) : '#'}
          target={support?.groupLink && support.groupLink !== '#' ? "_blank" : "_self"}
          rel="noopener noreferrer"
          onClick={(e) => { if (!support?.groupLink || support.groupLink === '#') e.preventDefault(); }}
          className="w-full flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-800 rounded-lg text-gray-400 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-100">Join Telegram Group</h3>
              <p className="text-xs text-gray-400">Interact with our community</p>
            </div>
          </div>
          <ExternalLink size={20} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
        </a>
      </div>
    </div>
  );
}
