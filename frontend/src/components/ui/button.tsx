import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 shadow-primary/20',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
  ghost: 'bg-transparent text-muted-foreground hover:bg-accent/10 hover:text-accent',
  icon: 'bg-transparent text-muted-foreground hover:bg-accent/10 hover:text-accent rounded-full',
}

const sizes = {
  default: 'px-6 py-2.5',
  sm: 'px-3 py-1.5 text-xs',
  lg: 'px-8 py-3 text-base',
  icon: 'h-10 w-10 p-2',
}

export function Button({
  className,
  variant = 'primary',
  size = 'default',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[12px] font-medium transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      type={type}
      {...props}
    />
  )
}
