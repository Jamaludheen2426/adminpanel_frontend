"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  pending?: boolean;
};

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, pending, ...props }, ref) => {
    if (pending) {
      return (
        <div className="relative inline-flex items-center">
          <div
            className={cn(
              "inline-flex h-6 w-11 shrink-0 items-center justify-center rounded-full border-2 border-transparent bg-yellow-100 dark:bg-yellow-900/40",
              className
            )}
          >
            {/* Pulsing centered thumb */}
            <span className="flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-yellow-400 shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>
          {/* PENDING text positioned outside on the right */}
          <span className="ml-2 text-[8px] font-semibold text-yellow-600 whitespace-nowrap">
            PENDING
          </span>
        </div>
      );
    }

    return (
      <SwitchPrimitives.Root
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-100 data-[state=unchecked]:bg-red-100 relative",
          className
        )}
        {...props}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform z-10 relative",
            "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
            "data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400",
            "before:content-['ON'] before:absolute before:right-[calc(100%+4px)] before:top-1/2 before:-translate-y-1/2 before:text-[8px] before:font-semibold before:text-green-600 before:whitespace-nowrap data-[state=unchecked]:before:opacity-0 data-[state=checked]:before:opacity-100 before:transition-opacity",
            "after:content-['OFF'] after:absolute after:left-[calc(100%+4px)] after:top-1/2 after:-translate-y-1/2 after:text-[8px] after:font-semibold after:text-red-600 after:whitespace-nowrap data-[state=checked]:after:opacity-0 data-[state=unchecked]:after:opacity-100 after:transition-opacity"
          )}
        />
      </SwitchPrimitives.Root>
    );
  }
);

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };