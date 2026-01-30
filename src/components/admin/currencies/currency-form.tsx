"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateCurrency, useUpdateCurrency } from "@/hooks/use-currencies";
import type { Currency } from "@/types";

const currencySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(3, "Code must be at least 3 characters").max(5, "Code must be at most 5 characters"),
  symbol: z.string().min(1, "Symbol is required"),
  exchangeRate: z.number().min(0, "Exchange rate must be positive"),
  isActive: z.boolean().default(true),
});

type CurrencyFormData = z.infer<typeof currencySchema>;

interface CurrencyFormProps {
  currency?: Currency | null;
  onSuccess?: () => void;
}

export function CurrencyForm({ currency, onSuccess }: CurrencyFormProps) {
  const createCurrencyMutation = useCreateCurrency();
  const updateCurrencyMutation = useUpdateCurrency();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      name: currency?.name || "",
      code: currency?.code || "",
      symbol: currency?.symbol || "",
      exchangeRate: currency?.exchange_rate || 1,
      isActive: currency?.is_active ?? true,
    },
  });

  const isActive = watch("isActive");

  const onSubmit = (data: CurrencyFormData) => {
    if (currency) {
      updateCurrencyMutation.mutate({ id: currency.id, data }, { onSuccess });
    } else {
      createCurrencyMutation.mutate(data, { onSuccess });
    }
  };

  const isPending = createCurrencyMutation.isPending || updateCurrencyMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="US Dollar" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          placeholder="USD"
          {...register("code")}
          disabled={!!currency}
        />
        {errors.code && (
          <p className="text-sm text-destructive">{errors.code.message}</p>
        )}
        <p className="text-xs text-muted-foreground">ISO currency code (e.g., USD, EUR, INR)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="symbol">Symbol</Label>
        <Input id="symbol" placeholder="$" {...register("symbol")} />
        {errors.symbol && (
          <p className="text-sm text-destructive">{errors.symbol.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="exchangeRate">Exchange Rate</Label>
        <Input
          id="exchangeRate"
          type="number"
          step="0.01"
          placeholder="1.00"
          {...register("exchangeRate", { valueAsNumber: true })}
        />
        {errors.exchangeRate && (
          <p className="text-sm text-destructive">{errors.exchangeRate.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between space-y-2">
        <div>
          <Label htmlFor="isActive">Active</Label>
          <p className="text-xs text-muted-foreground">Enable this currency</p>
        </div>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={(value) => setValue("isActive", value)}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : currency ? "Update Currency" : "Create Currency"}
        </Button>
      </div>
    </form>
  );
}
