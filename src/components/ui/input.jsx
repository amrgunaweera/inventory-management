import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-slate-200/80 bg-white px-3 py-1.5 text-xs text-slate-800 transition-all duration-200 ease-out outline-none placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-brand-400 focus-visible:ring-4 focus-visible:ring-brand-500/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50 aria-invalid:border-red-400 aria-invalid:ring-4 aria-invalid:ring-red-500/10 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-slate-800",
        className
      )}
      {...props} />
  );
}

export { Input }
