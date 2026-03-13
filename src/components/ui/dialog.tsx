import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/utils";
import { Button } from "./button";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange?.(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-50 mx-4 w-full max-w-lg">{children}</div>
    </div>
  );
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-background border-border relative rounded-lg border shadow-lg",
      "animate-in fade-in-0 zoom-in-95 duration-200",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)} {...props}>
    {children}
  </div>
));
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-lg leading-none font-semibold tracking-tight", className)} {...props}>
    {children}
  </h3>
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props}>
      {children}
    </p>
  ),
);
DialogDescription.displayName = "DialogDescription";

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col-reverse p-6 pt-4 sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  >
    {children}
  </div>
));
DialogFooter.displayName = "DialogFooter";

const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  ),
);
DialogClose.displayName = "DialogClose";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose };
