import { useNavigate } from 'react-router-dom';
import { IconArrowRight, IconSparkles } from '@tabler/icons-react';
import { Button } from './button';

export default function UpgradeBanner({ message = 'Upgrade to Pro to unlock this feature.' }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-brand-50 to-violet-50 border border-brand-200/40 rounded-2xl px-5 py-4 mb-6 shadow-framer-sm transition-all duration-300 ease-out hover:shadow-framer hover:-translate-y-0.5">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
        <IconSparkles size={18} className="text-white" />
      </div>
      <p className="text-sm text-slate-600 flex-1">{message}</p>
      <Button
        onClick={() => navigate('/billing')}
        className="flex-shrink-0 h-8 text-xs"
      >
        Upgrade <IconArrowRight size={14} className="ml-1" />
      </Button>
    </div>
  );
}
