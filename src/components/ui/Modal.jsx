import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizes = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={`${sizes[size]} w-full p-0 gap-0 overflow-hidden bg-white`}>
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-white rounded-t-3xl">
          <DialogTitle className="text-lg font-semibold text-slate-900">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
