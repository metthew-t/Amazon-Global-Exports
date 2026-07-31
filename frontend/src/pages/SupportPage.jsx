import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { MessageCircle, Users, ExternalLink } from 'lucide-react';

const FALLBACK_MANAGER_LINK = 'https://t.me/AGEs1122';
const FALLBACK_GROUP_LINK = 'https://t.me/+hDXOF4YstMcwMzQ0';

function resolveLink(apiValue, fallback) {
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

  if (isLoading) return <div className="text-center py-10 text-ink-muted">Loading...</div>;

  const managerUrl = resolveLink(support?.managerLink, FALLBACK_MANAGER_LINK);
  const groupUrl = resolveLink(support?.groupLink, FALLBACK_GROUP_LINK);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="u-page-header flex items-center gap-2"><MessageCircle size={24} /> Support</h1>
        <p className="u-page-sub">Get help or join our community on Telegram</p>
      </div>

      <div className="u-card-brand space-y-4">
        <a
          href={managerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between p-4 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100 transition-colors group cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-100 rounded-lg text-brand-600 group-hover:scale-110 transition-transform">
              <MessageCircle size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-brand-700">Contact Manager</h3>
              <p className="text-xs text-ink-muted">Directly message our support manager</p>
            </div>
          </div>
          <ExternalLink size={20} className="text-brand-500 group-hover:text-brand-600 transition-colors" />
        </a>

        <a
          href={groupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between p-4 bg-surface-page border border-surface-border rounded-xl hover:bg-surface-input transition-colors group cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white border border-surface-border rounded-lg text-ink-muted group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-ink">Join Telegram Group</h3>
              <p className="text-xs text-ink-muted">Interact with our community</p>
            </div>
          </div>
          <ExternalLink size={20} className="text-ink-faint group-hover:text-ink-muted transition-colors" />
        </a>
      </div>
    </div>
  );
}
