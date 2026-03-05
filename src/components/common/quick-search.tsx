"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface QuickSearchProps {
    onSearch: (value: string) => void;
    placeholder?: string;
    className?: string;
    delay?: number;
    initialValue?: string;
}

export function QuickSearch({
    onSearch,
    placeholder = "Search...",
    className,
    delay = 300,
    initialValue = "",
}: QuickSearchProps) {
    const [value, setValue] = useState(initialValue);
    const debouncedValue = useDebounce(value, delay);

    // Initial value sync
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    // Actual search trigger
    useEffect(() => {
        onSearch(debouncedValue);
    }, [debouncedValue, onSearch]);

    const handleClear = useCallback(() => {
        setValue("");
    }, []);

    return (
        <div className={cn("relative group transition-all", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-9 pr-10 h-10 w-full rounded-xl bg-muted/20 border-border/40 hover:bg-muted/40 focus:bg-background transition-all"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-muted"
                    onClick={handleClear}
                    title="Clear search"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </Button>
            )}
        </div>
    );
}
