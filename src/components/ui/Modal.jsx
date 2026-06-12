import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"

export default function Modal({ isOpen, onClose, title, description, icon, footer, children, size = 'md' }) {
  const sizes = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={`${sizes[size]} w-full p-0 gap-0 overflow-hidden bg-white`}>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className={`flex ${icon ? 'gap-4' : 'flex-col'}`}>
            {icon && (
              <div className="shrink-0 mt-0.5">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <DialogHeader className={icon ? "mb-1.5" : "mb-4"}>
                  <DialogTitle className="text-lg font-semibold text-slate-900">{title}</DialogTitle>
                </DialogHeader>
              )}
              {description && (
                <p className="text-sm text-slate-500 mb-4">{description}</p>
              )}
              {children && (
                <div className="text-sm text-slate-700">
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>
        {footer && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
