"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#FF0000",
  "#FF7F00",
  "#FFFF00",
  "#00FF00",
  "#0000FF",
  "#4B0082",
  "#9400D3",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#FFFFFF",
  "#000000",
];

interface ColorPickerProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onColorChange?: (color: string) => void;
  showPresets?: boolean;
}

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    { onColorChange, showPresets = true, className, value, ...props },
    ref
  ) => {
    const [color, setColor] = React.useState<string>(
      (value as string) || "#000000"
    );

    const handleColorChange = (newColor: string) => {
      setColor(newColor);
      onColorChange?.(newColor);
    };

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-lg border-2 border-muted-foreground/25 cursor-pointer shadow-sm"
            style={{ backgroundColor: color }}
            onClick={() => document.getElementById("color-input")?.click()}
          />
          <div className="flex-1">
            <input
              id="color-input"
              type="color"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="hidden"
              {...props}
            />
            <input
              type="text"
              value={color}
              onChange={(e) => {
                const val = e.target.value;
                if (val.match(/^#[0-9A-Fa-f]{6}$/)) {
                  handleColorChange(val);
                }
              }}
              placeholder="#000000"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {showPresets && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Preset Colors</p>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => handleColorChange(presetColor)}
                  className={cn(
                    "h-8 w-8 rounded-md border-2 transition-all hover:scale-110",
                    color === presetColor
                      ? "border-foreground ring-2 ring-foreground ring-offset-2"
                      : "border-muted-foreground/25"
                  )}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
