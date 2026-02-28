"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import {
    Bold, Italic, Underline, List, ListOrdered,
    Heading1, Heading2, Link as LinkIcon, Quote,
    Undo, Redo, RemoveFormatting
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface RichEditorProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

export function RichEditor({
    value = "",
    onChange,
    placeholder = "Type here...",
    className,
    minHeight = "200px"
}: RichEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const valueRef = useRef(value);

    // Sync content when value prop changes from outside
    useEffect(() => {
        if (editorRef.current && value !== valueRef.current) {
            editorRef.current.innerHTML = value || "";
            valueRef.current = value || "";
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            // Normalize common "empty" browser outputs
            const isEmpty = !html || html === "<br>" || html === "<div><br></div>" || html === "<div></div>" || html === "<p><br></p>";
            const newValue = isEmpty ? "" : html;

            if (newValue !== valueRef.current) {
                valueRef.current = newValue;
                onChange(newValue);
            }
        }
    }, [onChange]);

    const execCommand = (command: string, uiValue?: string) => {
        document.execCommand(command, false, uiValue);
        handleInput();
        if (editorRef.current) editorRef.current.focus();
    };

    return (
        <div className={cn(
            "flex flex-col border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-0 transition-all shadow-sm",
            className
        )}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-1 bg-muted/30 border-b select-none sticky top-0 z-10 transition-colors">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("bold")} title="Bold">
                    <Bold className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("italic")} title="Italic">
                    <Italic className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("underline")} title="Underline">
                    <Underline className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("formatBlock", "H2")} title="Small Heading">
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("formatBlock", "H3")} title="Smaller Heading">
                    <Heading2 className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("formatBlock", "BLOCKQUOTE")} title="Quote">
                    <Quote className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("insertUnorderedList")} title="Bullet List">
                    <List className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("insertOrderedList")} title="Numbered List">
                    <ListOrdered className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => {
                    const url = window.prompt("Enter URL", "https://");
                    if (url) execCommand("createLink", url);
                }} title="Insert Link">
                    <LinkIcon className="h-4 w-4" />
                </Button>

                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("removeFormat")} title="Clear Formatting">
                    <RemoveFormatting className="h-4 w-4" />
                </Button>

                <div className="ml-auto flex items-center gap-0.5">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("undo")} title="Undo">
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => execCommand("redo")} title="Redo">
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onBlur={handleInput}
                onPaste={(e) => {
                    // Force plain text paste or handle it? 
                    // For now, let browser handle it but trigger input
                    setTimeout(handleInput, 0);
                }}
                className="p-4 focus:outline-none prose prose-sm max-w-none dark:prose-invert overflow-y-auto"
                style={{ minHeight }}
                data-placeholder={placeholder}
            />

            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    cursor: text;
                    pointer-events: none;
                }
                [contenteditable] {
                    min-height: inherit;
                    outline: none;
                }
                /* Content Styles */
                :global(.prose h2) { font-size: 1.25rem !important; font-weight: 600 !important; margin-top: 1rem !important; margin-bottom: 0.5rem !important; line-height: 1.5 !important; }
                :global(.prose h3) { font-size: 1.1rem !important; font-weight: 600 !important; margin-top: 0.75rem !important; margin-bottom: 0.4rem !important; line-height: 1.5 !important; }
                :global(.prose ul) { list-style-type: disc !important; padding-left: 1.25rem !important; margin: 0.5rem 0 !important; }
                :global(.prose ol) { list-style-type: decimal !important; padding-left: 1.25rem !important; margin: 0.5rem 0 !important; }
                :global(.prose blockquote) { border-left: 3px solid #cbd5e1 !important; padding-left: 1rem !important; color: #64748b !important; font-style: italic !important; margin: 1rem 0 !important; }
                :global(.prose p) { margin: 0.5rem 0 !important; line-height: 1.6 !important; }
                :global(.prose a) { color: #3b82f6 !important; text-decoration: underline !important; }
            `}</style>
        </div>
    );
}
