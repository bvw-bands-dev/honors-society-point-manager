/*
 * Blue Flame's Honors Society Point Manager
 * Copyright (C) 2026 Blue Flame
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import Link from "next/link";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

import { type ClipboardEventHandler } from "react";

function Button({
  className,
  variant,
  size,
  href,
  disabled,
  asChild = false,
  target,
  onCopy,
  type,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    href?: string;
    target?: "_blank";
    download?: boolean;
    onCopy?:
      | ClipboardEventHandler<HTMLButtonElement>
      | ClipboardEventHandler<HTMLAnchorElement>;
  }) {
  let Comp: React.ElementType = "button"; // Default to "button"

  // Handle conditional component type
  if (asChild) {
    Comp = Slot;
  } else if (href) {
    Comp = !target ? Link : "a"; // If there's a href, render as anchor tag
  }

  // Handle button or anchor specific props and event handlers
  return (
    <Comp
      data-slot="button"
      type={Comp == "button" ? (type ?? "button") : undefined}
      className={cn(
        href && disabled && "pointer-events-none opacity-50",
        buttonVariants({ variant, size, className }),
      )}
      {...(href && { href })}
      {...(Comp == "a" && { target })}
      {...(Comp == "button" && { disabled })}
      {...props}
      onCopy={onCopy} // Pass down onCopy handler
    />
  );
}

export { Button, buttonVariants };
