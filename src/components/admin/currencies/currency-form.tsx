"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCurrency, useUpdateCurrency } from "@/hooks/use-currencies";
import type { Currency } from "@/types";

const NUMBER_FORMATS = [
  { value: "western",  label: "Western (1,234,567.89)",   decimal: ".",  thousand: "," },
  { value: "european", label: "European (1.234.567,89)",   decimal: ",",  thousand: "." },
  { value: "swiss",    label: "Swiss (1 234 567.89)",      decimal: ".",  thousand: " " },
  { value: "indian",   label: "Indian (1,23,45,678.90)",   decimal: ".",  thousand: "," },
  { value: "none",     label: "No separator (1234567.89)", decimal: ".",  thousand: "" },
];

const detectFormat = (decimal: string, thousand: string) =>
  NUMBER_FORMATS.find(f => f.decimal === decimal && f.thousand === thousand)?.value ?? "western";

const currencySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(3).max(5),
  symbol: z.string().min(1),
  exchange_rate: z.coerce.number().min(0),
  decimal_places: z.coerce.number().int().min(0).max(8).default(2),
  number_format: z.string().default("western"),
  symbol_position: z.enum(["before", "after"]).default("before"),
  space_between: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type CurrencyFormData = z.infer<typeof currencySchema>;

interface CurrencyFormProps {
  currency?: Currency | null;
  onSuccess?: () => void;
}

export function CurrencyForm({ currency, onSuccess }: CurrencyFormProps) {
  const createMutation = useCreateCurrency();
  const updateMutation = useUpdateCurrency();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      name: currency?.name ?? "",
      code: currency?.code ?? "",
      symbol: currency?.symbol ?? "",
      exchange_rate: currency?.exchange_rate ?? 1,
      decimal_places: currency?.decimal_places ?? 2,
      number_format: detectFormat(
        currency?.decimal_separator ?? ".",
        currency?.thousand_separator ?? ","
      ),
      symbol_position: currency?.symbol_position ?? "before",
      space_between: Boolean(currency?.space_between),
      is_active: currency ? Boolean(currency.is_active) : true,
    },
  });

  const isActive = watch("is_active");
  const spaceBetween = watch("space_between");
  const numberFormat = watch("number_format");
  const symbolPosition = watch("symbol_position");

  const onSubmit = (data: CurrencyFormData) => {
    const fmt =
      NUMBER_FORMATS.find(f => f.value === data.number_format) ??
      NUMBER_FORMATS[0];

    const payload = {
      name: data.name.trim(),
      code: data.code.toUpperCase().trim(),
      symbol: data.symbol.trim(),
      exchange_rate: data.exchange_rate,
      decimal_places: data.decimal_places,
      decimal_separator: fmt.decimal,
      thousand_separator: fmt.thousand,
      symbol_position: data.symbol_position,
      space_between: data.space_between,
      is_active: data.is_active,
    };

    if (currency) {
      updateMutation.mutate(
        { id: currency.id, data: payload },
        { onSuccess }
      );
    } else {
      createMutation.mutate(payload, { onSuccess });
    }
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* Name */}
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input placeholder="US Dollar" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Code */}
      <div className="space-y-2">
        <Label>Code *</Label>
        <Input
          placeholder="USD"
          className="font-mono uppercase"
          {...register("code")}
          disabled={!!currency}
        />
        {errors.code && (
          <p className="text-sm text-destructive">{errors.code.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          ISO currency code (e.g. USD, EUR, INR)
        </p>
      </div>

      {/* Symbol */}
      <div className="space-y-2">
        <Label>Symbol *</Label>
        <Input placeholder="$" {...register("symbol")} />
        {errors.symbol && (
          <p className="text-sm text-destructive">{errors.symbol.message}</p>
        )}
      </div>

      {/* Exchange Rate */}
      <div className="space-y-2">
        <Label>Exchange Rate</Label>
        <Input
          type="number"
          step="0.0001"
          min="0"
          {...register("exchange_rate")}
          disabled={!!currency?.is_default}
        />
        {currency?.is_default && (
          <p className="text-xs text-muted-foreground">
            Default currency always has rate 1
          </p>
        )}
      </div>

      {/* Decimal Places */}
      <div className="space-y-2">
        <Label>Decimal Places</Label>
        <Input
          type="number"
          min="0"
          max="8"
          step="1"
          {...register("decimal_places")}
        />
      </div>

      {/* Number Format */}
      <div className="space-y-2">
        <Label>Number Format</Label>
        <Select
          value={numberFormat}
          onValueChange={val => setValue("number_format", val)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NUMBER_FORMATS.map(f => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Symbol Position */}
      <div className="space-y-2">
        <Label>Symbol Position</Label>
        <Select
          value={symbolPosition}
          onValueChange={val =>
            setValue("symbol_position", val as "before" | "after")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="before">
              Before number ($100)
            </SelectItem>
            <SelectItem value="after">
              After number (100$)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Space Between */}
      <div className="md:col-span-2 flex items-center justify-between border rounded-lg p-3">
        <Label className="cursor-pointer font-normal">
          Space between symbol and amount
        </Label>
        <Checkbox
          checked={spaceBetween}
          onCheckedChange={v =>
            setValue("space_between", Boolean(v))
          }
        />
      </div>

      {/* Is Active */}
      <div className="md:col-span-2 flex items-center justify-between border rounded-lg p-3">
        <Label>Is Active?</Label>
        <Switch
          checked={isActive}
          onCheckedChange={v =>
            setValue("is_active", v)
          }
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full md:col-span-2"
        disabled={isPending}
      >
        {isPending
          ? "Saving..."
          : currency
          ? "Update Currency"
          : "Create Currency"}
      </Button>
    </form>
  );
}