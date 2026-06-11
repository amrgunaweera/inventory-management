import { useNavigate } from 'react-router-dom';
import { IconLock, IconArrowRight } from '@tabler/icons-react';

export default function PlanGate({ feature, children }) {
  const navigate = useNavigate();
  // Children passed from parent with gating check done in parent
  return children;
}

export function LockedOverlay({ feature }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
        <IconLock size={28} className="text-slate-400" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-700 mb-2">Feature Locked</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          This feature is available on the <strong>Pro</strong> plan and above.
          Upgrade to unlock it.
        </p>
      </div>
      <button
        onClick={() => navigate('/billing')}
        className="btn-primary"
      >
        Upgrade Plan <IconArrowRight size={16} />
      </button>
    </div>
  );
}
