"use client";

import { useFormStatus } from "react-dom";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground shadow-sm shadow-accent/30 hover:bg-accent-hover hover:shadow-accent/40",
  secondary:
    "bg-surface border border-border text-foreground hover:bg-surface-hover hover:border-accent/40",
  danger: "text-danger hover:bg-danger-bg",
  ghost: "text-muted hover:bg-surface-hover hover:text-foreground",
};

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2z"
      />
    </svg>
  );
}

export function SubmitButton({
  action,
  pendingLabel,
  variant = "primary",
  className = "",
  children,
}: {
  action?: (formData: FormData) => void | Promise<void>;
  pendingLabel?: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  const status = useFormStatus();
  const isThisPending = status.pending && (!action || status.action === action);

  return (
    <button
      type="submit"
      formAction={action}
      aria-busy={isThisPending}
      disabled={status.pending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {isThisPending && <Spinner />}
      {isThisPending ? pendingLabel ?? "Working…" : children}
    </button>
  );
}
