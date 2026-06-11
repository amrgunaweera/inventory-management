import { useNavigate } from 'react-router-dom';
import { IconLock, IconArrowRight } from '@tabler/icons-react';
import { Button } from './button';

export default function PlanGate({ feature, children }) {
  const navigate = useNavigate();
  return children;
}

export function LockedOverlay({ feature }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center shadow-framer-sm transition-transform duration-300 ease-out hover:scale-110 hover:rotate-3">
        <IconLock size={28} className="text-slate-400" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Feature Locked</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          This feature is available on the <strong>Pro</strong> plan and above.
          Upgrade to unlock it.
        </p>
      </div>
      <Button
        onClick={() => navigate('/billing')}
      >
        Upgrade Plan <IconArrowRight size={16} className="ml-2" />
      </Button>
    </div>
  );
}
