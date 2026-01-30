"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onFilesSelected?: (files: File[]) => void;
  maxSize?: number;
  maxFiles?: number;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      onFilesSelected,
      maxSize = 5 * 1024 * 1024,
      maxFiles = 1,
      className,
      accept,
      ...props
    },
    ref
  ) => {
    const [files, setFiles] = React.useState<File[]>([]);
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(Array.from(e.target.files));
      }
    };

    const handleFiles = (newFiles: File[]) => {
      let updatedFiles = [...files, ...newFiles];

      if (updatedFiles.length > maxFiles) {
        updatedFiles = updatedFiles.slice(0, maxFiles);
      }

      updatedFiles = updatedFiles.filter((file) => file.size <= maxSize);

      setFiles(updatedFiles);
      onFilesSelected?.(updatedFiles);
    };

    const removeFile = (index: number) => {
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      onFilesSelected?.(updatedFiles);
    };

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple={maxFiles > 1}
            accept={accept}
            onChange={handleChange}
            className="hidden"
            {...props}
          />
          <div
            className="flex cursor-pointer flex-col items-center justify-center px-6 py-12"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              {accept ? `Accepted formats: ${accept}` : "Any file type"}
            </p>
            {maxSize && (
              <p className="text-xs text-muted-foreground">
                Max file size: {(maxSize / 1024 / 1024).toFixed(2)}MB
              </p>
            )}
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </p>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border bg-muted/50 p-3"
                >
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
