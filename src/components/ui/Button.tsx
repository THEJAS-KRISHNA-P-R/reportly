import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        primary: 'bg-[#C17B2F] text-white hover:bg-[#A86824] hover:shadow-md hover:-translate-y-0.5 active:bg-[#8B6B1F] active:shadow-sm active:translate-y-0 disabled:bg-[#E5E5E5] disabled:text-[#888888] focus-visible:outline-[#0A0A0A]',
        secondary: 'bg-white text-[#0A0A0A] border border-[#E5E5E5] hover:bg-[#F5F4F2] hover:border-[#CCCCCC] hover:shadow-sm active:bg-[#EEEEEC] active:shadow-none disabled:bg-[#F7F7F5] disabled:opacity-50 focus-visible:outline-[#0A0A0A]',
        outline: 'border border-[#E5E5E5] bg-white text-[#0A0A0A] hover:bg-[#F5F4F2] hover:border-[#CCCCCC] hover:shadow-sm active:bg-[#EEEEEC] focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2',
        ghost: 'text-[#3D3D3D] hover:text-[#0A0A0A] hover:bg-[#F0F0EE] active:bg-[#E8E8E6] transition-colors duration-150 focus-visible:outline-[#0A0A0A]',
        destructive: 'bg-white text-[#8B1F2A] border border-[#E5E5E5] hover:bg-[#FFF4F4] hover:border-[#8B1F2A]/30 active:bg-[#FFE8E8] focus-visible:outline-[#8B1F2A]',
        link: 'text-[#C17B2F] underline-offset-4 hover:underline focus-visible:outline-[#C17B2F]',
        dark: 'bg-white/10 text-white border border-white/15 hover:bg-white/18 hover:border-white/25 active:bg-white/8 focus-visible:outline-white',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
