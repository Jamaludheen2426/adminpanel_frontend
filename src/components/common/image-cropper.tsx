"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Crop, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
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

interface ImageCropperProps {
  title: string;
  description: string;
  targetWidth: number;
  targetHeight: number;
  currentImage?: string;
  onImageCropped: (file: File) => void;
  onRemove: () => void;
}

const centerAspectCrop = (
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): PercentCrop => {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
};

export function ImageCropper({
  title,
  description,
  targetWidth,
  targetHeight,
  currentImage,
  onImageCropped,
  onRemove,
}: ImageCropperProps) {
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [scale, setScale] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const aspect = targetWidth / targetHeight;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setCrop(undefined);
      setCompletedCrop(null);
      setScale(1);

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
        setShowCropDialog(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
      setCrop(centerAspectCrop(width, height, aspect));
    },
    [aspect]
  );

  const handleScaleChange = (value: number[]) => {
    setScale(value[0]);
  };

  const resetCrop = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect));
      setScale(1);
    }
  };

  const getCroppedImage = useCallback(async (): Promise<File | null> => {
    if (!imgRef.current || !completedCrop || !canvasRef.current || !selectedFile) {
      return null;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set output size to target dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.imageSmoothingQuality = "high";

    // Calculate the source rectangle from the completed crop
    const sourceX = completedCrop.x * scaleX;
    const sourceY = completedCrop.y * scaleY;
    const sourceWidth = completedCrop.width * scaleX;
    const sourceHeight = completedCrop.height * scaleY;

    // Draw the cropped image scaled to target dimensions
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], selectedFile.name, {
              type: selectedFile.type || "image/png",
              lastModified: Date.now(),
            });
            resolve(croppedFile);
          } else {
            resolve(null);
          }
        },
        selectedFile.type || "image/png",
        0.95
      );
    });
  }, [completedCrop, selectedFile, targetWidth, targetHeight]);

  const handleCrop = async () => {
    const croppedFile = await getCroppedImage();
    if (croppedFile) {
      onImageCropped(croppedFile);
      handleClose();
    }
  };

  const handleClose = () => {
    setShowCropDialog(false);
    setSelectedFile(null);
    setImgSrc("");
    setCrop(undefined);
    setCompletedCrop(null);
    setScale(1);
  };

  // Calculate crop area dimensions in pixels
  const cropAreaPx = completedCrop && imgRef.current
    ? {
        width: Math.round(completedCrop.width * (imgRef.current.naturalWidth / imgRef.current.width)),
        height: Math.round(completedCrop.height * (imgRef.current.naturalHeight / imgRef.current.height)),
      }
    : { width: 0, height: 0 };

  return (
    <>
      <div className="space-y-4">
        <Label>{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium text-sm">
          Target: {targetWidth} × {targetHeight}px
        </div>

        <div className="flex items-start gap-4 flex-wrap">
          {currentImage && (
            <div className="relative inline-block">
              <div className="border rounded-lg p-4 bg-muted/50">
                <img
                  src={currentImage}
                  alt={title}
                  className="max-h-24 object-contain"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {currentImage ? "Change Image" : "Choose Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </Button>
        </div>
      </div>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Adjust the crop area to {targetWidth}×{targetHeight}px. Drag the corners to resize.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image dimensions info */}
            <div className="grid grid-cols-3 gap-2 text-sm bg-muted/50 rounded-lg p-3">
              <div className="text-center">
                <div className="text-muted-foreground text-xs mb-1">Original</div>
                <div className="font-semibold">
                  {imageDimensions.width} × {imageDimensions.height}px
                </div>
              </div>
              <div className="text-center border-x">
                <div className="text-muted-foreground text-xs mb-1">Crop Area</div>
                <div className="font-semibold text-primary">
                  {cropAreaPx.width} × {cropAreaPx.height}px
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs mb-1">Output</div>
                <div className="font-semibold text-green-600">
                  {targetWidth} × {targetHeight}px
                </div>
              </div>
            </div>

            {/* Crop area */}
            <div className="flex justify-center items-center bg-muted/50 rounded-lg p-4 min-h-[400px]">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  className="max-h-[400px]"
                  style={{
                    "--ReactCrop-crop-border": "2px solid hsl(var(--primary))",
                  } as React.CSSProperties}
                >
                  <img
                    ref={imgRef}
                    alt="Crop"
                    src={imgSrc}
                    style={{ transform: `scale(${scale})` }}
                    onLoad={onImageLoad}
                    className="max-h-[400px] w-auto"
                  />
                </ReactCrop>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Zoom</Label>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={[scale]}
                      onValueChange={handleScaleChange}
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

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-base">💡</span>
                <span>
                  Drag the corners to resize the crop area. Drag inside to move it. Use zoom to scale the image.
                </span>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleCrop} disabled={!completedCrop}>
              <Crop className="mr-2 h-4 w-4" />
              Crop & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
