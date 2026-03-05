"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Crop, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from "react-image-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import "react-image-crop/dist/ReactCrop.css";

interface MediaCropDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Image URL of the existing file to crop */
  imageUrl: string;
  /** Original file name (used to name the resulting File object) */
  fileName: string;
  /** MIME type of the image (e.g. "image/jpeg") */
  mimeType: string;
  /** Called when the user cancels or closes the dialog */
  onClose: () => void;
  /**
   * Called when the user clicks "Crop & Save" with the resulting cropped File
   * and a data URL of the cropped image for immediate local preview.
   */
  onCropped: (file: File, dataUrl: string) => void;
  /** Whether the save/upload is in progress (shows loading state on save button) */
  isSaving?: boolean;
}

const DEFAULT_CROP: CropType = {
  unit: "%",
  width: 80,
  height: 80,
  x: 10,
  y: 10,
};

export function MediaCropDialog({
  open,
  imageUrl,
  fileName,
  mimeType,
  onClose,
  onCropped,
  isSaving = false,
}: MediaCropDialogProps) {
  const [crop, setCrop] = useState<CropType>(DEFAULT_CROP);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [scale, setScale] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state whenever the dialog opens with a new image
  useEffect(() => {
    if (open) {
      setCrop(DEFAULT_CROP);
      setCompletedCrop(null);
      setScale(1);
      setImageDimensions({ width: 0, height: 0 });
    }
  }, [open, imageUrl]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
    },
    []
  );

  const resetCrop = () => {
    setCrop(DEFAULT_CROP);
    setScale(1);
  };

  // Calculate the crop area in natural pixels for the info bar
  const cropAreaPx =
    completedCrop && imgRef.current
      ? {
          width: Math.round(
            completedCrop.width *
              (imgRef.current.naturalWidth / imgRef.current.width)
          ),
          height: Math.round(
            completedCrop.height *
              (imgRef.current.naturalHeight / imgRef.current.height)
          ),
        }
      : { width: 0, height: 0 };

  const handleCropAndSave = useCallback(async () => {
    if (!imgRef.current || !crop.width || !crop.height) return;

    const image = imgRef.current;
    const nW = image.naturalWidth;
    const nH = image.naturalHeight;

    // Use percent-based math — resolution independent
    const sx = (crop.x * nW) / 100;
    const sy = (crop.y * nH) / 100;
    const sw = (crop.width * nW) / 100;
    const sh = (crop.height * nH) / 100;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, Math.round(sw), Math.round(sh));

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], fileName, {
          type: mimeType,
          lastModified: Date.now(),
        });

        // Convert blob → data URL for instant local preview (no CDN wait)
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          onCropped(file, dataUrl);
        };
        reader.readAsDataURL(blob);
      },
      mimeType,
      0.98
    );
  }, [crop, fileName, mimeType, onCropped]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Drag to select the crop area. Use zoom to scale the image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dimension info bar — matches common ImageCropper style */}
          <div className="grid grid-cols-3 gap-2 text-sm bg-muted/50 rounded-lg p-3">
            <div className="text-center">
              <div className="text-muted-foreground text-xs mb-1">Original</div>
              <div className="font-semibold">
                {imageDimensions.width > 0
                  ? `${imageDimensions.width} × ${imageDimensions.height}px`
                  : "—"}
              </div>
            </div>
            <div className="text-center border-x">
              <div className="text-muted-foreground text-xs mb-1">
                Crop Area
              </div>
              <div className="font-semibold text-primary">
                {cropAreaPx.width > 0
                  ? `${cropAreaPx.width} × ${cropAreaPx.height}px`
                  : "—"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-xs mb-1">Output</div>
              <div className="font-semibold text-green-600">
                {cropAreaPx.width > 0
                  ? `${cropAreaPx.width} × ${cropAreaPx.height}px`
                  : "Free-form"}
              </div>
            </div>
          </div>

          {/* Crop area */}
          <div className="flex justify-center items-center bg-muted/50 rounded-lg p-4 min-h-[400px] overflow-auto">
            {imageUrl && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-[400px]"
                style={
                  {
                    "--ReactCrop-crop-border": "2px solid hsl(var(--primary))",
                  } as React.CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Crop preview"
                  crossOrigin="anonymous"
                  onLoad={onImageLoad}
                  style={{
                    transform: `scale(${scale})`,
                    maxHeight: "400px",
                    width: "auto",
                  }}
                />
              </ReactCrop>
            )}
          </div>

          {/* Controls — matches common ImageCropper layout */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zoom slider */}
              <div className="space-y-2">
                <Label className="text-sm">Zoom</Label>
                <div className="flex items-center gap-2">
                  <ZoomOut className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[scale]}
                    onValueChange={(v) => setScale(v[0])}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium w-12 text-right">
                    {scale.toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* Reset button */}
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetCrop}
                  className="flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Hint */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-base">💡</span>
              <span>
                Drag inside the image to move the crop area. Drag corners to
                resize. Use zoom to scale the image. The cropped image will
                replace the original file.
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleCropAndSave}
            disabled={!completedCrop || isSaving}
          >
            <Crop className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Crop & Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
