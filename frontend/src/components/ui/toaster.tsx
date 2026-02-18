import { Toaster as Sonner } from "sonner"

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
          closeButton: "!text-black",
        },
      }}
    />
  )
}
