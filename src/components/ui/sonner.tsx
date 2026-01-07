import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { cn } from "@/lib/utils";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={true}
      offset="30vh"
      richColors={false}
      toastOptions={{
        classNames: {
          toast: cn(
            // Base glass-morphism styling
            "group toast backdrop-blur-xl border shadow-lg",
            "rounded-xl p-4",
            "font-sans",
            // Default state
            "bg-card/80 border-border/50 text-foreground",
            // Success variant
            "data-[type=success]:bg-primary/10 data-[type=success]:border-primary/20",
            "data-[type=success]:shadow-[0_4px_12px_rgba(22,163,74,0.15)]",
            // Error variant
            "data-[type=error]:bg-destructive/10 data-[type=error]:border-destructive/20",
            "data-[type=error]:shadow-[0_4px_12px_rgba(239,68,68,0.15)]",
            // Warning variant
            "data-[type=warning]:bg-warning/10 data-[type=warning]:border-warning/20",
            "data-[type=warning]:shadow-[0_4px_12px_rgba(249,115,22,0.15)]",
            // Info variant
            "data-[type=info]:bg-secondary/10 data-[type=info]:border-secondary/20",
            "data-[type=info]:shadow-[0_4px_12px_rgba(245,158,11,0.15)]"
          ),
          title: "font-display font-semibold text-[15px] leading-tight",
          description: "text-[13px] text-muted-foreground mt-1",
          actionButton: cn(
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            "font-medium px-3 py-1.5 rounded-lg",
            "transition-colors"
          ),
          cancelButton: cn(
            "bg-muted text-muted-foreground",
            "hover:bg-muted/80",
            "font-medium px-3 py-1.5 rounded-lg",
            "transition-colors"
          ),
          closeButton: cn(
            "bg-background/50 border border-border/50",
            "hover:bg-background/80",
            "rounded-lg transition-colors"
          ),
          icon: cn(
            "w-5 h-5",
            // Icon color variants
            "data-[type=success]:text-primary",
            "data-[type=error]:text-destructive",
            "data-[type=warning]:text-warning",
            "data-[type=info]:text-secondary"
          ),
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
