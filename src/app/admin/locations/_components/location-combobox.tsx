'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface LocationComboboxProps {
  items: { id: number; name: string }[];
  value: string;          // 'all' or item id as string
  onValueChange: (v: string) => void;
  allLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationCombobox({
  items,
  value,
  onValueChange,
  allLabel = 'All',
  placeholder = 'Search...',
  disabled,
  className,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = value !== 'all' ? items.find((i) => String(i.id) === value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn('w-44 justify-between font-normal text-sm', className)}
        >
          <span className="truncate">{selected ? selected.name : allLabel}</span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandItem
              value="__all__"
              onSelect={() => { onValueChange('all'); setOpen(false); }}
            >
              <Check className={cn('mr-2 h-4 w-4', value === 'all' ? 'opacity-100' : 'opacity-0')} />
              {allLabel}
            </CommandItem>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.name}
                onSelect={() => { onValueChange(String(item.id)); setOpen(false); }}
              >
                <Check className={cn('mr-2 h-4 w-4', String(item.id) === value ? 'opacity-100' : 'opacity-0')} />
                {item.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
