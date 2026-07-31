import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { MessageCircle, Users, ExternalLink } from 'lucide-react';

const FALLBACK_MANAGER_LINK = 'https://t.me/AGEs1122';
const FALLBACK_GROUP_LINK = 'https://t.me/+hDXOF4YstMcwMzQ0';

function resolveLink(apiValue, fallback) {
  // Use API value if it's a real link, otherwise fall back to hardcoded
  if (apiValue && typeof apiValue === 'string') {
    const trimmed = apiValue.trim();
    if (trimmed && trimmed !== '#' && !trimmed.includes('your_group_link') && !trimmed.includes('your_manager_link')) {
      return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    }
  }
  return fallback;
}

export default function SupportPage() {
  const { data: support, isLoading } = useQuery({
    queryKey: ['supportLinks'],
    queryFn: async () => (await api.get('/dashboard/support')).data,
  });

  if (isLoading) return <div className="text-center py-10 text-gray-500">Loading...</div>;

  const managerUrl = resolveLink(support?.managerLink, FALLBACK_MANAGER_LINK);
  const groupUrl = resolveLink(support?.groupLink, FALLBACK_GROUP_LINK);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header flex items-center gap-2"><MessageCircle size={24} /> Support</h1>
        <p className="page-sub">Get help or join our community on Telegram</p>
      </div>

      <div className="card-gold space-y-4">
        <a
          href={managerUrl}
          target="_blank"
          rel="noopener noreferrer"
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
          href={groupUrl}
          target="_blank"
          rel="noopener noreferrer"
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
