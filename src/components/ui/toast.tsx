import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------- Provider -------------------------------- */

const ToastProvider = ToastPrimitives.Provider;

/* -------------------------------- Viewport -------------------------------- */

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 z-[100] flex max-h-screen w-full flex-col gap-3 px-4",
      "sm:bottom-4 sm:right-4 sm:top-auto sm:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

/* -------------------------------- Variants -------------------------------- */

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-4 overflow-hidden rounded-xl border p-4 pr-10 shadow-xl backdrop-blur-md transition-all",
  {
    variants: {
      variant: {
        default:
          "border-green-100 bg-white text-gray-800",
        success:
          "border-green-200 bg-green-50 text-green-900",
        destructive:
          "border-red-200 bg-red-50 text-red-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/* -------------------------------- Toast Root -------------------------------- */

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(
      toastVariants({ variant }),
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      "data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-bottom-full",
      className,
    )}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

/* -------------------------------- Action -------------------------------- */

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium",
      "border border-green-200 bg-white text-green-700",
      "hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400",
      "group-[.destructive]:border-red-200 group-[.destructive]:text-red-700 group-[.destructive]:hover:bg-red-100",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

/* -------------------------------- Close -------------------------------- */

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-md p-1 text-gray-400 transition",
      "hover:bg-gray-100 hover:text-gray-700",
      "focus:outline-none focus:ring-2 focus:ring-green-400",
      "group-[.destructive]:hover:bg-red-100 group-[.destructive]:focus:ring-red-400",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

/* -------------------------------- Title -------------------------------- */

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-none", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

/* -------------------------------- Description -------------------------------- */

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

/* -------------------------------- Types -------------------------------- */

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

/* -------------------------------- Exports -------------------------------- */

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
