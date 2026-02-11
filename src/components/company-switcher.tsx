'use client';

import { useState } from 'react';
import { Building2, Check } from 'lucide-react';
import { useCompany } from '@/contexts/company-context';
import { useCompanies } from '@/hooks/use-companies';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export function CompanySwitcher() {
  const [open, setOpen] = useState(false);
  const { currentCompanyId, setCurrentCompanyId, isDeveloper } = useCompany();
  const { data: companiesResponse, isLoading } = useCompanies({ limit: 100 });

  // Only show for developer users
  if (!isDeveloper) {
    return null;
  }

  const companies = companiesResponse?.data || [];
  const currentCompany = companies.find(c => c.id === currentCompanyId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-[200px] justify-start"
        >
          <Building2 className="mr-2 h-4 w-4" />
          <span className="truncate">
            {currentCompany?.name || 'System Level (All)'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle>Switch Company</DialogTitle>
          <DialogDescription>
            Select a company to manage or view system-level data
          </DialogDescription>
        </DialogHeader>
        <Command className="border-0">
          <CommandInput placeholder="Search company..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Loading companies...' : 'No company found.'}
            </CommandEmpty>
            
            {/* System Level Option */}
            <CommandGroup heading="System">
              <CommandItem
                onSelect={() => {
                  setCurrentCompanyId(null);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span>System Level (All)</span>
                <Check
                  className={cn(
                    'ml-auto h-4 w-4',
                    currentCompanyId === null ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {/* Companies List */}
            <CommandGroup heading="Companies">
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  onSelect={() => {
                    setCurrentCompanyId(company.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate">{company.name}</span>
                    {company.status !== 'active' && (
                      <span className="text-xs text-muted-foreground">
                        ({company.status})
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4 shrink-0',
                      currentCompanyId === company.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}