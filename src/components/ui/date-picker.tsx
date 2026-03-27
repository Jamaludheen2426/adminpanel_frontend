"use client";

import * as React from "react";
import { format, parseISO, setMonth, setYear, getMonth, getYear } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange: (val: string) => void;
  required?: boolean;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  /** Year range: how many years back from current year */
  yearRangeStart?: number;
  /** Year range: how many years forward from current year */
  yearRangeEnd?: number;
}

export function DatePicker({
  label,
  value,
  onChange,
  required,
  error,
  minDate,
  maxDate,
  placeholder = "DD-MM-YYYY",
  disabled,
  yearRangeStart = 80,
  yearRangeEnd = 10,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parseISO(value) : undefined;

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - yearRangeStart;
  const endYear = currentYear + yearRangeEnd;

  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    selected || new Date()
  );

  // Sync displayMonth when value changes externally
  React.useEffect(() => {
    if (selected) {
      setDisplayMonth(selected);
    }
  }, [value]);

  const years = React.useMemo(() => {
    const yrs: number[] = [];
    for (let y = endYear; y >= startYear; y--) {
      yrs.push(y);
    }
    return yrs;
  }, [startYear, endYear]);

  const handleMonthChange = (monthStr: string) => {
    const newDate = setMonth(displayMonth, parseInt(monthStr));
    setDisplayMonth(newDate);
  };

  const handleYearChange = (yearStr: string) => {
    const newDate = setYear(displayMonth, parseInt(yearStr));
    setDisplayMonth(newDate);
  };

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? format(date, "yyyy-MM-dd") : "");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(parseISO(value), "dd MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            {/* Month & Year Selectors */}
            <div className="flex items-center gap-2">
              <Select
                value={getMonth(displayMonth).toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="h-8 flex-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, i) => (
                    <SelectItem key={month} value={i.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={getYear(displayMonth).toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="h-8 w-[90px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendar */}
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              showOutsideDays
              className="!p-0"
              classNames={{
                months: "flex flex-col",
                month: "space-y-2",
                nav: "flex items-center justify-between",
                button_previous: cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-7 w-7 p-0"
                ),
                button_next: cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-7 w-7 p-0"
                ),
                month_caption: "hidden",
                table: "w-full border-collapse",
                weekdays: "flex",
                weekday:
                  "text-muted-foreground w-8 font-normal text-[0.8rem] text-center",
                week: "flex w-full mt-1",
                day: "h-8 w-8 p-0 text-center text-sm relative",
                day_button: cn(
                  "h-8 w-8 p-0 font-normal inline-flex items-center justify-center rounded-md text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "aria-selected:opacity-100"
                ),
                selected:
                  "[&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:hover:bg-primary [&_button]:hover:text-primary-foreground",
                today: "[&_button]:bg-accent [&_button]:text-accent-foreground",
                outside: "text-muted-foreground opacity-50",
                disabled: "text-muted-foreground opacity-50",
                hidden: "invisible",
              }}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === "left" ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  ),
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
