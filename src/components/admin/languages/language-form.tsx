"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateLanguage, useUpdateLanguage } from "@/hooks/use-languages";
import type { Language } from "@/types";

const languageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").max(10, "Code must be at most 10 characters"),
  native_name: z.string().optional(),
  direction: z.enum(["ltr", "rtl"]).default("ltr"),
  is_active: z.boolean().default(true),
});

type LanguageFormData = z.infer<typeof languageSchema>;

interface LanguageFormProps {
  language?: Language | null;
  onSuccess?: () => void;
}

export function LanguageForm({ language, onSuccess }: LanguageFormProps) {
  const createLanguageMutation = useCreateLanguage();
  const updateLanguageMutation = useUpdateLanguage();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LanguageFormData>({
    resolver: zodResolver(languageSchema),
    defaultValues: {
      name: language?.name || "",
      code: language?.code || "",
      native_name: language?.native_name || "",
      direction: language?.direction || "ltr",
      is_active: language?.is_active ?? true,
    },
  });

  const direction = watch("direction");
  const isActive = watch("is_active");

  const onSubmit = (data: LanguageFormData) => {
    if (language) {
      updateLanguageMutation.mutate({ id: language.id, data }, { onSuccess });
    } else {
      createLanguageMutation.mutate(data, { onSuccess });
    }
  };

  const isPending = createLanguageMutation.isPending || updateLanguageMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="English" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          placeholder="en"
          {...register("code")}
          disabled={!!language}
        />
        {errors.code && (
          <p className="text-sm text-destructive">{errors.code.message}</p>
        )}
        <p className="text-xs text-muted-foreground">ISO language code (e.g., en, hi, ar)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nativeName">Native Name</Label>
        <Input id="nativeName" placeholder="English" {...register("native_name")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="direction">Text Direction</Label>
        <Select value={direction} onValueChange={(value: "ltr" | "rtl") => setValue("direction", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ltr">Left to Right (LTR)</SelectItem>
            <SelectItem value="rtl">Right to Left (RTL)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between border rounded-lg p-3">
        <Label htmlFor="isActive">Is Active?</Label>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setValue("is_active", checked)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : language ? "Update Language" : "Create Language"}
      </Button>
    </form>
  );
}
