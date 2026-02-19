import { Toaster as Sonner } from "sonner"
import styles from "./toaster.module.css"

export function Toaster() {
  return (
    <Sonner
      richColors
      position="top-right"
      closeButton
      toastOptions={{
        style: {
          fontSize: "0.9rem",
          opacity: 0.8,
        },
        classNames: {
          closeButton: styles.closeButton,
        },
      }}
    />
  )
}
