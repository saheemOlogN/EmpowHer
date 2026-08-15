import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils.js";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-border bg-card text-foreground hover:bg-muted",
  coral: "border border-destructive bg-card text-destructive hover:bg-muted",
  sage: "bg-accent text-accent-foreground hover:bg-accent/90",
  ghost: "text-foreground hover:bg-muted"
};

const sizes = {
  default: "h-10 px-4",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-5",
  icon: "h-10 w-10"
};

export function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
