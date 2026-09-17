import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px focus-visible:outline-none focus-visible:shadow-focus';

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-xs hover:bg-brand-700',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong hover:bg-subtle shadow-xs',
  ghost: 'text-ink-2 hover:bg-subtle hover:text-ink',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  danger: 'bg-danger-600 text-white hover:bg-danger-700',
  dark: 'bg-ink text-white hover:bg-ink-2',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
});

export function LinkButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
  ...props
}: LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode; iconRight?: ReactNode }) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps & { label: string }>(function IconButton(
  { label, variant = 'ghost', size = 'md', className, children, type = 'button', ...props },
  ref,
) {
  const dim = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-12' : 'size-10';
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(base, variants[variant], dim, 'px-0', className)}
      {...props}
    >
      {children}
    </button>
  );
});
