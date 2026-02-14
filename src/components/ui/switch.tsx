"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  pending?: boolean;
  onText?: string;
  offText?: string;
};

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, pending, onText = "ON", offText = "OFF", ...props }, ref) => {
    // Calculate width based on longest text: thumb(20px) + text space + padding
    const longestText = onText.length > offText.length ? onText : offText;
    const trackWidth = Math.max(64, 28 + longestText.length * 7);

    const pendingText = "PENDING";
    const pendingWidth = Math.max(64, 28 + pendingText.length * 7);

    if (pending) {
      return (
        <div
          style={{ width: pendingWidth }}
          className={cn(
            "inline-flex h-7 shrink-0 items-center rounded-full border-2 border-transparent bg-yellow-100 dark:bg-yellow-900/40 relative px-1 cursor-not-allowed opacity-80",
            className
          )}
        >
          <span
            aria-hidden
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-yellow-600 select-none pointer-events-none"
          >
            {pendingText}
          </span>
          <span className="block h-5 w-5 rounded-full bg-yellow-400 shadow-lg animate-pulse" />
        </div>
      );
    }

    const thumbTranslate = trackWidth - 28;

    return (
      <SwitchPrimitives.Root
        style={{ width: trackWidth }}
        className={cn(
          "peer inline-flex h-6 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-100 data-[state=unchecked]:bg-red-100 relative px-1",
          className
        )}
        {...props}
        ref={ref}
      >
        {/* On text - left side, visible when checked */}
        <span
          aria-hidden
          className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-green-600 select-none pointer-events-none transition-opacity"
          style={{ opacity: props.checked ? 1 : 0 }}
        >
          {onText}
        </span>
        {/* Off text - right side, visible when unchecked */}
        <span
          aria-hidden
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-red-600 select-none pointer-events-none transition-opacity"
          style={{ opacity: props.checked ? 0 : 1 }}
        >
          {offText}
        </span>
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform z-10",
            "data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
          )}
          style={{
            transform: `translateX(${props.checked ? thumbTranslate : 0}px)`,
            transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </SwitchPrimitives.Root>
    );
  }
);

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
