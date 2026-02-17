import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "../../lib/utils"

function Progress({ className, value = 0, ...props }: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { value?: number }) {
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-indigo-600 transition-transform dark:bg-indigo-500"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
