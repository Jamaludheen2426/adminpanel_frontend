'use client';

import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface FormFieldProps {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, error, helper, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

export function TextInput({ label, error, helper, required, ...props }: TextInputProps) {
  return (
    <FormField label={label} error={error} helper={helper} required={required}>
      <Input {...props} />
    </FormField>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

export function TextAreaInput({ label, error, helper, required, ...props }: TextAreaProps) {
  return (
    <FormField label={label} error={error} helper={helper} required={required}>
      <Textarea {...props} />
    </FormField>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  helper?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  error,
  helper,
  required,
  placeholder = 'Select an option',
  disabled,
}: SelectFieldProps) {
  return (
    <FormField label={label} error={error} helper={helper} required={required}>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

interface SwitchFieldProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  helper?: string;
  disabled?: boolean;
}

export function SwitchField({ label, checked, onCheckedChange, helper, disabled }: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 border rounded-lg bg-background hover:bg-accent/50">
      <div>
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
