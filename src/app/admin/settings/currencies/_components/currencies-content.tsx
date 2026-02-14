"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCurrencies, useDeleteCurrency, useSetDefaultCurrency } from "@/hooks/use-currencies";
import { CurrencyForm } from "@/components/admin/currencies/currency-form";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import type { Currency } from "@/types";

export function CurrenciesContent() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  const { data, isLoading } = useCurrencies({ page, limit: 10, search });
  const deleteCurrencyMutation = useDeleteCurrency();
  const setDefaultMutation = useSetDefaultCurrency();

  const handleEdit = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('currencies.delete_confirm'))) {
      deleteCurrencyMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedCurrency(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('currencies.title')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCurrency(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('currencies.add_currency')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedCurrency ? t('currencies.edit_currency') : t('currencies.add_currency')}</DialogTitle>
              <DialogDescription>
                {selectedCurrency ? t('currencies.edit_desc') : t('currencies.add_desc')}
              </DialogDescription>
            </DialogHeader>
            <CurrencyForm currency={selectedCurrency} onSuccess={handleDialogClose} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('currencies.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.code')}</TableHead>
                    <TableHead>{t('currencies.symbol')}</TableHead>
                    <TableHead>{t('currencies.exchange_rate')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((currency) => (
                    <TableRow key={currency.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {currency.name}
                          {currency.is_default && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {currency.code}
                        </code>
                      </TableCell>
                      <TableCell>{currency.symbol}</TableCell>
                      <TableCell>{currency.exchange_rate}</TableCell>
                      <TableCell>
                        <Badge
                          className={currency.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100"
                          }
                        >
                          {currency.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!currency.is_default && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSetDefault(currency.id)}
                              disabled={setDefaultMutation.isPending}
                              title="Set as default"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(currency)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(currency.id)}
                            disabled={deleteCurrencyMutation.isPending || currency.is_default}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.data?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('currencies.no_currencies_found')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('common.page', 'Page')} {data.pagination.page} / {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!data.pagination.hasPrevPage}
                    >
                      {t('common.previous', 'Previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!data.pagination.hasNextPage}
                    >
                      {t('common.next', 'Next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
