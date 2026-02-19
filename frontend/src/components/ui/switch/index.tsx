import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "../../../lib/utils"
import styles from "./switch.module.css"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      styles.root,
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={styles.thumb}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = "Switch"

export { Switch }
