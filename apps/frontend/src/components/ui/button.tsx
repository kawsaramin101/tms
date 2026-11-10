
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-sans text-sm font-semibold tracking-[-0.02em] whitespace-nowrap transition-all duration-200 ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-[0.4rem] bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground hover:text-background hover:shadow-[0_3px_0_var(--border)] active:shadow-none",

        outline:
          "rounded-[0.4rem] border-border bg-transparent text-foreground hover:border-primary hover:bg-accent hover:text-accent-foreground",

        secondary:
          "rounded-[0.4rem] bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_7%)]",

        ghost:
          "rounded-[0.3rem] bg-transparent text-foreground hover:bg-transparent hover:text-primary",

        destructive:
          "rounded-[0.4rem] bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/30 dark:bg-destructive/20 dark:hover:bg-destructive/30",

        link:
          "rounded-none bg-transparent text-primary underline-offset-4 hover:text-foreground hover:underline",
      },

      size: {
        default:
          "h-9 gap-1.5 px-4 text-[0.8125rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",

        xs:
          "h-6 gap-1 rounded-[0.25rem] px-2 text-[0.6875rem] [&_svg:not([class*='size-'])]:size-3",

        sm:
          "h-7 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",

        lg:
          "h-10 gap-1.5 px-5 text-sm [&_svg:not([class*='size-'])]:size-4",

        icon:
          "size-9 rounded-[0.4rem] [&_svg:not([class*='size-'])]:size-3.5",

        "icon-xs":
          "size-6 rounded-[0.25rem] [&_svg:not([class*='size-'])]:size-3",

        "icon-sm":
          "size-7 rounded-[0.3rem] [&_svg:not([class*='size-'])]:size-3",

        "icon-lg":
          "size-10 rounded-[0.4rem] [&_svg:not([class*='size-'])]:size-4",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : ButtonPrimitive

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
