import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out hover:scale-[1.03] active:scale-[0.97] [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-brand-500 text-white",
        secondary: "bg-slate-100 text-slate-600 border-slate-200/60",
        destructive: "bg-red-50 text-red-600 border-red-200/60",
        outline: "border-slate-200 text-slate-600 bg-white",
        ghost: "hover:bg-slate-100 text-slate-500",
        link: "text-brand-500 underline-offset-4 hover:underline",
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        inactive: 'bg-slate-50 text-slate-500 border-slate-200/60',
        low: 'bg-amber-50 text-amber-700 border-amber-200/60',
        out: 'bg-red-50 text-red-700 border-red-200/60',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
        processing: 'bg-blue-50 text-blue-700 border-blue-200/60',
        cancelled: 'bg-red-50 text-red-700 border-red-200/60',
        sale: 'bg-brand-50 text-brand-700 border-brand-200/60',
        purchase: 'bg-violet-50 text-violet-700 border-violet-200/60',
        free: 'bg-slate-100 text-slate-600 border-slate-200/60',
        pro: 'bg-brand-50 text-brand-700 border-brand-200/60',
        business: 'bg-violet-50 text-violet-700 border-violet-200/60',
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps({
      className: cn(badgeVariants({ variant }), className),
    }, props),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants }
