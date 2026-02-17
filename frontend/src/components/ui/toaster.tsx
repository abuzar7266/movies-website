import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      richColors
      position="top-right"
      toastOptions={{
        style: { fontSize: "0.9rem" },
      }}
    />
  )
}
