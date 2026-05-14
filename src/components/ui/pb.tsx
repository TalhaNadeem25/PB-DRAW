/**
 * PB Draw design system primitives.
 * Use these for all new screens. Shadcn components remain for existing flows.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import React from "react";

// ─── Eyebrow ───────────────────────────────────────────────────────────────
// Mono uppercase tagline. Appears above every section title and KPI block.

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-pb-muted",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Dot ───────────────────────────────────────────────────────────────────
// Status indicator dot. pulse=true triggers the amber pbpulse animation.

export function Dot({
  color = "amber",
  size = 8,
  pulse = false,
  className,
}: {
  color?: "amber" | "court" | "ink" | string;
  size?: number;
  pulse?: boolean;
  className?: string;
}) {
  const colorMap: Record<string, string> = {
    amber: "var(--pb-amber)",
    court: "var(--pb-court)",
    ink:   "var(--pb-ink)",
  };
  const bg = colorMap[color] ?? color;

  return (
    <span
      className={cn("inline-block rounded-full shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: bg,
        animation: pulse ? "pbpulse 1.6s ease-out infinite" : undefined,
      }}
    />
  );
}

// ─── Pill ──────────────────────────────────────────────────────────────────
// Status/format badge. mono prop adds tabular mono tracking.

const pillVariants = cva(
  "inline-flex items-center gap-1.5 px-[9px] py-1 rounded-full border text-[11px] font-medium leading-none",
  {
    variants: {
      tone: {
        neutral: "bg-pb-paper text-pb-ink2 border-pb-hairline",
        court:   "bg-pb-court-tint text-pb-court-ink border-[#CCDAC9]",
        amber:   "bg-pb-amber-tint text-[#7C3F0A] border-[#E8C9A1]",
        blue:    "bg-pb-blue-tint text-pb-blue border-[#C7D2E8]",
        ink:     "bg-pb-ink text-white border-pb-ink",
        outline: "bg-transparent text-pb-ink2 border-pb-rule",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {
  mono?: boolean;
}

export function Pill({ children, tone, mono = false, className, ...props }: PillProps) {
  return (
    <span
      className={cn(
        pillVariants({ tone }),
        mono && "font-mono text-[10.5px] tracking-[0.04em] uppercase",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── PbBtn ─────────────────────────────────────────────────────────────────
// Named PbBtn to avoid collision with shadcn Button.

const pbBtnVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans font-medium rounded-[6px] cursor-pointer border transition-colors duration-150 tracking-[-0.005em] shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-pb-ink text-white border-pb-ink hover:opacity-90",
        court:   "bg-pb-court text-[#F2F8EE] border-pb-court hover:opacity-90",
        amber:   "bg-pb-amber text-[#FFF8EE] border-pb-amber hover:opacity-90",
        outline: "bg-transparent text-pb-ink border-pb-rule hover:bg-pb-surface2",
        ghost:   "bg-transparent text-pb-ink border-transparent hover:bg-pb-surface2",
      },
      size: {
        sm: "px-[11px] py-[7px] text-[12.5px] gap-[6px]",
        md: "px-[16px] py-[10px] text-[13px] gap-[8px]",
        lg: "px-[20px] py-[13px] text-[14px] gap-[10px]",
      },
      full: {
        true:  "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: { variant: "primary", size: "md", full: false },
  }
);

export interface PbBtnProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pbBtnVariants> {
  asChild?: boolean;
}

export function PbBtn({ variant, size, full, className, children, asChild, ...props }: PbBtnProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(pbBtnVariants({ variant, size, full }), className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

// ─── PbCard ────────────────────────────────────────────────────────────────
// White surface, hairline border, no shadow. padded=false for multi-section cards.

export function PbCard({
  children,
  padded = true,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div
      className={cn(
        "bg-pb-surface border border-pb-hairline rounded-[6px]",
        padded && "p-[22px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── PbAvatar ──────────────────────────────────────────────────────────────
// Initials avatar. tone controls bg/text/border.

const avatarTones = {
  paper: "bg-pb-paper text-pb-ink2 border-pb-hairline",
  court: "bg-pb-court text-[#F2F8EE] border-pb-court",
  amber: "bg-pb-amber text-[#FFF8EE] border-pb-amber",
  ink:   "bg-pb-ink text-white border-pb-ink",
} as const;

export function PbAvatar({
  name,
  size = 28,
  tone = "paper",
  className,
}: {
  name: string;
  size?: number;
  tone?: keyof typeof avatarTones;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-sans font-semibold shrink-0",
        avatarTones[tone],
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ─── SectionHead ───────────────────────────────────────────────────────────
// Eyebrow + Bricolage display title + optional right action.

export function SectionHead({
  eyebrow,
  title,
  action,
  dense = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  action?: React.ReactNode;
  dense?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-end justify-between",
        dense ? "py-3" : "py-5",
        className
      )}
    >
      <div className="space-y-1.5">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className={cn("font-display font-bold tracking-[-0.025em] text-pb-ink leading-tight", dense ? "text-[22px]" : "text-[28px]")}>
          {title}
        </h2>
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}

// ─── KPI ───────────────────────────────────────────────────────────────────
// Eyebrow label + large mono number + optional delta caption.

export function KPI({
  label,
  value,
  delta,
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Eyebrow>{label}</Eyebrow>
      <div
        className="font-mono text-[32px] font-medium leading-none tracking-[-0.02em] text-pb-ink"
        style={{ fontFeatureSettings: '"tnum" 1' }}
      >
        {value}
      </div>
      {delta && (
        <div className="font-mono text-[11px] text-pb-muted tracking-[0.02em]">
          {delta}
        </div>
      )}
    </div>
  );
}

// ─── PbLogo ────────────────────────────────────────────────────────────────
// Wordmark — Bricolage 800 with a two-circle SVG mark.

export function PbLogo({
  size = 18,
  color = "var(--pb-ink)",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9"  cy="12" r="7" stroke={color} strokeWidth="1.6" />
        <circle cx="15" cy="12" r="7" stroke={color} strokeWidth="1.6" />
        <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="1.6" />
      </svg>
      <span
        className="font-display font-extrabold tracking-[-0.02em] leading-none"
        style={{ fontSize: size * 0.95, color }}
      >
        PB Draw
      </span>
    </div>
  );
}
