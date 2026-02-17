import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "../../lib/utils"

function Slider({ className, ...props }: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <SliderPrimitive.Range className="absolute h-full bg-indigo-600 dark:bg-indigo-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border border-gray-300 bg-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900" />
    </SliderPrimitive.Root>
  )
}

export { Slider }
