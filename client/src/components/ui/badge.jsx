import { cn } from "../../lib/utils.js";

const variants = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-border bg-secondary text-secondary-foreground",
  destructive: "border-transparent bg-destructive text-destructive-foreground",
  outline: "border-border text-foreground"
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold", variants[variant], className)}
      {...props}
    />
  );
}
