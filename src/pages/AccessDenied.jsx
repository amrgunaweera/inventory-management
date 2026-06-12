import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { IconShieldOff, IconArrowLeft, IconHome } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute } from '../lib/roles';


export default function AccessDenied() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center animate-slide-up">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-200 flex items-center justify-center mx-auto mb-6">
          <IconShieldOff size={36} className="text-rose-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-500 mb-2">
          You don't have permission to access this page.
        </p>

        {/* Role info */}
        {user?.roleLabel && (
          <p className="text-xs text-slate-400 mb-6">
            Your current role: <span className="font-semibold text-slate-600">{user.roleLabel}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => navigate(-1)} variant="outline" className="inline-flex items-center gap-2"
          >
            <IconArrowLeft size={16} />
            Go Back
          </Button>
          <Button onClick={() => navigate(user ? getDefaultRoute(user.role) : '/login')} variant="default" className="inline-flex items-center gap-2"
          >
            <IconHome size={16} />
            Dashboard
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-slate-400 mt-8">
          Contact your administrator if you need access to this area.
        </p>
      </div>
    </div>
  );
}
