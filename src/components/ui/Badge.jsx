export function Badge({ children, variant = 'default' }) {
  const variants = {
    default:   'bg-slate-100 text-slate-600',
    active:    'bg-emerald-100 text-emerald-700',
    inactive:  'bg-slate-100 text-slate-500',
    low:       'bg-amber-100 text-amber-700',
    out:       'bg-red-100 text-red-700',
    completed: 'bg-emerald-100 text-emerald-700',
    pending:   'bg-amber-100 text-amber-700',
    processing:'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    sale:      'bg-brand-100 text-brand-700',
    purchase:  'bg-violet-100 text-violet-700',
    free:      'bg-slate-200 text-slate-600',
    pro:       'bg-brand-100 text-brand-700',
    business:  'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`badge ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}
