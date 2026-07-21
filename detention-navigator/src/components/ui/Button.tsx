import { type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const styles: Record<Variant, string> = {
  primary: 'bg-[#1F3550] text-[#FBF7F2] hover:bg-[#162840] active:scale-[0.98]',
  danger:  'bg-[#C0564A] text-white hover:bg-[#a84840] active:scale-[0.98]',
  ghost:   'border border-[#1F3550] text-[#1F3550] hover:bg-[#1F3550]/10 active:scale-[0.98]',
}

export function Button({ variant = 'primary', fullWidth, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        'min-h-[44px] px-6 py-3 rounded-xl font-semibold text-base transition-all',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F3550]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        fullWidth ? 'w-full' : '',
        styles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
