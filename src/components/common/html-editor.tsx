"use client";

import { useState } from "react";
import { Code, Eye, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  helpText?: string;
  showResetButton?: boolean;
  onReset?: () => void;
  resetButtonText?: string;
}

export function HtmlEditor({
  value,
  onChange,
  label = "HTML Content",
  placeholder = "Enter your HTML content here...",
  rows = 16,
  helpText,
  showResetButton = false,
  onReset,
  resetButtonText = "Reset to Default",
}: HtmlEditorProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "beautifier" | "preview">("editor");

  const beautifyHtml = (html: string): string => {
    try {
      let formatted = html;
      let indent = 0;
      const tab = "  ";
      let result = "";
      let inTag = false;
      let tagBuffer = "";

      for (let i = 0; i < formatted.length; i++) {
        const char = formatted[i];

        if (char === "<") {
          if (tagBuffer.trim()) {
            result += tagBuffer;
            tagBuffer = "";
          }
          inTag = true;
          tagBuffer = char;
        } else if (char === ">") {
          tagBuffer += char;
          inTag = false;

          const tag = tagBuffer.trim();
          const isClosingTag = tag.startsWith("</");
          const isSelfClosing = tag.endsWith("/>") || tag.startsWith("<!") || tag.startsWith("<?");
          const isOpeningTag = !isClosingTag && !isSelfClosing;

          if (isClosingTag) {
            indent = Math.max(0, indent - 1);
            result += "\n" + tab.repeat(indent) + tag;
          } else if (isSelfClosing) {
            result += "\n" + tab.repeat(indent) + tag;
          } else if (isOpeningTag) {
            result += "\n" + tab.repeat(indent) + tag;
            indent++;
          }

          tagBuffer = "";
        } else if (inTag) {
          tagBuffer += char;
        } else {
          tagBuffer += char;
        }
      }

      if (tagBuffer.trim()) {
        result += tagBuffer;
      }

      return result.trim();
    } catch (error) {
      console.error("Error beautifying HTML:", error);
      return html;
    }
  };

  const handleBeautify = () => {
    const beautified = beautifyHtml(value);
    onChange(beautified);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="beautifier" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Beautifier
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {showResetButton && onReset && (
            <Button variant="outline" size="sm" onClick={onReset}>
              {resetButtonText}
            </Button>
          )}
        </div>

        <TabsContent value="editor" className="space-y-2 mt-0">
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="font-mono text-sm"
          />
          {helpText && (
            <p className="text-xs text-muted-foreground">{helpText}</p>
          )}
        </TabsContent>

        <TabsContent value="beautifier" className="space-y-2 mt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Format HTML Code</p>
                <p className="text-xs text-muted-foreground">
                  Automatically indent and organize your HTML for better readability
                </p>
              </div>
              <Button onClick={handleBeautify} size="sm">
                <Wand2 className="h-4 w-4 mr-2" />
                Beautify
              </Button>
            </div>

            <Textarea
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={rows}
              className="font-mono text-sm"
            />
            {helpText && (
              <p className="text-xs text-muted-foreground">{helpText}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-2 mt-0">
          <div className="border rounded-lg p-6 min-h-[400px] bg-background overflow-auto">
            {value.includes("<html") || value.includes("<!DOCTYPE") ? (
              <iframe
                srcDoc={value}
                className="w-full min-h-[400px] border-0"
                title="HTML Preview"
                sandbox="allow-same-origin"
              />
            ) : (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Live preview of your HTML content
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}