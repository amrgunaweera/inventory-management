import { useNavigate } from 'react-router-dom';
import { IconArrowRight, IconSparkles } from '@tabler/icons-react';

export default function UpgradeBanner({ message = 'Upgrade to Pro to unlock this feature.' }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-brand-500/10 to-violet-500/10 border border-brand-200 rounded-xl px-5 py-4 mb-6">
      <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
        <IconSparkles size={16} className="text-brand-500" />
      </div>
      <p className="text-sm text-slate-700 flex-1">{message}</p>
      <button
        onClick={() => navigate('/billing')}
        className="btn-primary flex-shrink-0 text-xs py-1.5"
      >
        Upgrade <IconArrowRight size={14} />
      </button>
    </div>
  );
}
