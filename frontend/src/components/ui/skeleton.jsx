// Lightweight helper to join class names (replaces missing '@/lib/utils' alias)
const cn = (...classes) => classes.filter(Boolean).join(' ')

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
