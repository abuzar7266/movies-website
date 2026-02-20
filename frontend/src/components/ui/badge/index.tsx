import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@lib/utils"
import styles from "./badge.module.css"

const badgeVariants = cva(
  styles.badge,
  {
    variants: {
      variant: {
        default: styles.variantDefault,
        secondary: styles.variantSecondary,
        outline: styles.variantOutline,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
