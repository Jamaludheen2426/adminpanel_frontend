import { cn } from "@/lib/utils"

function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("animate-spin rounded-full border-b-2 border-primary", className)}
    />
  )
}

export { Spinner }
