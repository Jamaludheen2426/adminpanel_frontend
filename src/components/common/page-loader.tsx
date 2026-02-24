"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  open: boolean;
  text?: string;
}

export function PageLoader({
  open,
  text = "Loading...",
}: PageLoaderProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="z-[1000] max-w-sm flex flex-col items-center justify-center gap-4 py-10"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden><DialogTitle>Loading</DialogTitle></VisuallyHidden>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm font-medium text-center">
          {text}
        </p>
      </DialogContent>
    </Dialog>
  );
}