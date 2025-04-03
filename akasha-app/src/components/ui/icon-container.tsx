import * as React from "react";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const iconContainerStyles = cva(
  "flex items-center justify-center relative bg-zinc-100 dark:bg-zinc-800",
  {
    variants: {
      variant: {
        square: "rounded-lg",
        round: "rounded-full",
      },
      size: {
        xl: "size-28 [&_svg]:size-10",
        lg: "size-12 [&_svg]:size-6",
        md: "size-10 [&_svg]:size-5",
        sm: "size-8 [&_svg]:size-4",
        xs: "size-4 [&_svg]:size-4",
      },
    },
    compoundVariants: [
      {
        variant: "square",
        size: "xs",
        class: "rounded-sm",
      },
    ],
    defaultVariants: {
      variant: "round",
      size: "md",
    },
  }
);

const IconContainer = ({
  variant,
  size,
  className,
  showNotificationDot = false,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof iconContainerStyles> & {
    showNotificationDot?: boolean; // If true, show the notification dot
  }) => {
  return (
    <div
      data-slot="icon-container"
      className={iconContainerStyles({ variant, size, className })}
      {...props}
    >
      {children}
      {showNotificationDot && (
        <div
          className={cn(
            "absolute rounded-full w-3 h-3 bg-orange-500 top-0 right-0",
            variant === "square" && "-right-1"
          )}
        />
      )}
    </div>
  );
};

export { IconContainer };
