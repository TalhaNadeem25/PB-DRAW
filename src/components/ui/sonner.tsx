import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const isNative = Capacitor.isNativePlatform();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group pointer-events-none [&_[data-sonner-toast]]:pointer-events-auto"
      position={isNative ? "bottom-center" : "bottom-right"}
      expand={false}
      offset={isNative ? "5.5rem" : "1.5rem"}
      gap={8}
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast: cn(
            "group toast backdrop-blur-xl border shadow-lg pointer-events-auto",
            "rounded-2xl px-4 py-3 min-w-[280px] max-w-[380px]",
            "font-sans text-foreground",
            "bg-card/90 border-border/60",
            "data-[type=success]:bg-primary/10 data-[type=success]:border-primary/30 data-[type=success]:shadow-float",
            "data-[type=error]:bg-destructive/10 data-[type=error]:border-destructive/30 data-[type=error]:shadow-md",
            "data-[type=warning]:bg-secondary/10 data-[type=warning]:border-secondary/30 data-[type=warning]:shadow-md",
            "data-[type=info]:bg-accent/50 data-[type=info]:border-primary/20 data-[type=info]:shadow-md"
          ),
          title: "font-display font-semibold text-sm leading-tight",
          description: "text-xs text-muted-foreground mt-0.5",
          actionButton: cn(
            "bg-primary text-primary-foreground font-display font-semibold",
            "hover:bg-primary/90 px-3 py-1.5 rounded-xl text-xs",
            "transition-colors"
          ),
          cancelButton: cn(
            "bg-muted text-muted-foreground font-display font-semibold",
            "hover:bg-muted/80 px-3 py-1.5 rounded-xl text-xs",
            "transition-colors"
          ),
          closeButton: cn(
            "bg-muted/50 border border-border/50 hover:bg-muted",
            "rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          ),
          icon: cn(
            "w-5 h-5 shrink-0",
            "data-[type=success]:text-primary",
            "data-[type=error]:text-destructive",
            "data-[type=warning]:text-secondary",
            "data-[type=info]:text-primary"
          ),
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
