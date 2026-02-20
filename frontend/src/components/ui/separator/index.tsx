import * as React from "react"
import { cn } from "@lib/utils"
import styles from "./separator.module.css"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

export function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        styles.separator,
        orientation === "horizontal" ? styles.horizontal : styles.vertical,
        className
      )}
      {...props}
    />
  )
}
