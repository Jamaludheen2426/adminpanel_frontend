"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Crop, RotateCcw, ZoomIn, ZoomOut, Images } from "lucide-react";
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
import { MediaPickerModal } from "@/components/common/media-picker-modal";
import { toast } from "sonner";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperProps {
  title: string;
  description: string;
  targetWidth: number;
  targetHeight: number;
  currentImage?: string;
  onImageCropped: (file: File) => void;
  onRemove: () => void;
  /** Custom accept attribute for the file input (default: "image/*") */
  accept?: string;
  /** If true, skip the crop dialog and pass the file directly */
  skipCrop?: boolean;
  /** If true, show the preview as a circle */
  rounded?: boolean;
  /** If false, hides the Upload from device button (default: true) */
  showUpload?: boolean;
}

export function ImageCropper({
  title,
  description,
  targetWidth,
  targetHeight,
  currentImage,
  onImageCropped,
  onRemove,
  accept = "image/*",
  skipCrop = false,
  rounded = false,
  showUpload = true,
}: ImageCropperProps) {
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [scale, setScale] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [localPreview, setLocalPreview] = useState<string>("");

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const aspect = targetWidth / targetHeight;

  const handleRemoveClick = () => {
    setLocalPreview("");
    onRemove();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (skipCrop) {
        onImageCropped(file);
        return;
      }

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

  const calculateExactCrop = useCallback(
    (imgWidth: number, imgHeight: number, naturalWidth: number): PercentCrop => {
      const targetPercentWidth = Math.min(100, (targetWidth / naturalWidth) * 100);
      return centerCrop(
        makeAspectCrop(
          { unit: "%", width: targetPercentWidth },
          aspect,
          imgWidth,
          imgHeight
        ),
        imgWidth,
        imgHeight
      );
    },
    [targetWidth, aspect]
  );

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height, naturalWidth } = e.currentTarget;
      setImageDimensions({ width: naturalWidth, height: e.currentTarget.naturalHeight });
      setCrop(calculateExactCrop(width, height, naturalWidth));
    },
    [calculateExactCrop]
  );

  const handleScaleChange = (value: number[]) => {
    setScale(value[0]);
  };

  const resetCrop = () => {
    if (imgRef.current) {
      const { width, height, naturalWidth } = imgRef.current;
      setCrop(calculateExactCrop(width, height, naturalWidth));
      setScale(1);
    }
  };

  const getCroppedImage = useCallback(async (): Promise<File | null> => {
    if (!imgRef.current || !completedCrop || !canvasRef.current || !imgSrc) {
      return null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Load a fresh off-DOM image from imgSrc instead of using imgRef.current.
    // The DOM element can carry cross-origin taint even after its src changes,
    // but a new Image() loaded from a data URL is always origin-clean.
    const offscreenImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imgSrc;
    });

    // Read display dimensions from the ref (just numbers — does not taint).
    const displayWidth = imgRef.current.width;
    const displayHeight = imgRef.current.height;

    const scaleX = offscreenImg.naturalWidth / displayWidth;
    const scaleY = offscreenImg.naturalHeight / displayHeight;

    const sourceX = completedCrop.x * scaleX;
    const sourceY = completedCrop.y * scaleY;
    const sourceWidth = completedCrop.width * scaleX;
    const sourceHeight = completedCrop.height * scaleY;

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(offscreenImg, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

    const mimeType = selectedFile?.type || "image/jpeg";
    const fileName = selectedFile?.name || "image.jpg";
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], fileName, { type: mimeType, lastModified: Date.now() }));
          } else {
            resolve(null);
          }
        },
        mimeType,
        0.95
      );
    });
  }, [completedCrop, selectedFile, targetWidth, targetHeight, imgSrc]);

  const handleCrop = async () => {
    const croppedFile = await getCroppedImage();
    if (croppedFile) {
      const blobUrl = URL.createObjectURL(croppedFile);
      setLocalPreview(blobUrl);
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

  const handleMediaSelect = async (url: string) => {
    setMediaPickerOpen(false);
    setSelectedFile(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setScale(1);

    // Use /api/proxy-image which server-side fetches the image and returns it
    // same-origin — guarantees canvas.toBlob() never throws SecurityError.
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setImgSrc(dataUrl);
      setShowCropDialog(true);
    } catch {
      toast.error("Failed to load image for cropping. Please try again.");
    }
  };

  const displayImage = localPreview || currentImage;

  const cropAreaPx = completedCrop && imgRef.current
    ? {
      width: Math.round(completedCrop.width * (imgRef.current.naturalWidth / imgRef.current.width)),
      height: Math.round(completedCrop.height * (imgRef.current.naturalHeight / imgRef.current.height)),
    }
    : { width: 0, height: 0 };

  return (
    <>
      <div className="flex items-center gap-6 p-4 border rounded-xl bg-muted/30">
        <div className="relative group">
          <div className={`h-24 w-24 overflow-hidden border-4 border-background shadow-xl ${rounded ? 'rounded-full' : 'rounded-2xl'} bg-muted flex items-center justify-center`}>
            {displayImage ? (
              <img
                src={displayImage}
                alt={title}
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
              />
            ) : (
              <div className="text-muted-foreground">
                <Images className="h-8 w-8 opacity-20" />
              </div>
            )}
          </div>

          {displayImage && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveClick}
              title="Remove Image"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground leading-relaxed italic">{description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => setMediaPickerOpen(true)}
            >
              <Images className="mr-2 h-4 w-4" />
              {currentImage ? "Change Image" : "Choose Image"}
            </Button>

            {showUpload && (
              <Button variant="ghost" size="sm" asChild className="h-9 px-3 text-muted-foreground cursor-pointer">
                <label>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload
                  <input
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </Button>
            )}

            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-2 py-1 border rounded bg-muted/50">
              {targetWidth}x{targetHeight} Px
            </div>
          </div>
        </div>
      </div>

      {/* Crop Dialog — triggered by Upload button */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Adjust the crop area to {targetWidth}×{targetHeight}px. Drag the corners to resize.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-sm bg-muted/50 rounded-lg p-3">
              <div className="text-center">
                <div className="text-muted-foreground text-xs mb-1">Original</div>
                <div className="font-semibold">{imageDimensions.width} × {imageDimensions.height}px</div>
              </div>
              <div className="text-center border-x">
                <div className="text-muted-foreground text-xs mb-1">Crop Area</div>
                <div className="font-semibold text-primary">{cropAreaPx.width} × {cropAreaPx.height}px</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs mb-1">Output</div>
                <div className="font-semibold text-green-600">{targetWidth} × {targetHeight}px</div>
              </div>
            </div>

            <div className="flex justify-center items-center bg-muted/50 rounded-lg p-4 min-h-[400px]">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  locked={true}
                  className="max-h-[400px]"
                  style={{ "--ReactCrop-crop-border": "2px solid hsl(var(--primary))" } as React.CSSProperties}
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

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Zoom</Label>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="h-4 w-4 text-muted-foreground" />
                    <Slider value={[scale]} onValueChange={handleScaleChange} min={0.5} max={3} step={0.1} className="flex-1" />
                    <ZoomIn className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium w-12 text-right">{scale.toFixed(1)}x</span>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="outline" size="sm" onClick={resetCrop} className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-base">💡</span>
                <span>Drag the corners to resize the crop area. Drag inside to move it. Use zoom to scale the image.</span>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleCrop} disabled={!completedCrop}>
              <Crop className="mr-2 h-4 w-4" />
              Crop & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </>
  );
}
