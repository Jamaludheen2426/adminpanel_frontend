"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCurrencies,
  useDeleteCurrency,
  useSetDefaultCurrency,
  useToggleCurrencyStatus,
} from "@/hooks/use-currencies";
import { CurrencyForm } from "@/components/admin/currencies/currency-form";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { isApprovalRequired } from "@/lib/api-client";
import type { Currency } from "@/types";
import { PageLoader } from '@/components/common/page-loader';

export function CurrenciesContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] =
    useState<Currency | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currencyToDelete, setCurrencyToDelete] =
    useState<number | null>(null);

  const { data, isLoading } = useCurrencies({
    page,
    limit: 10,
    search,
  });

  const deleteMutation = useDeleteCurrency();
  const setDefaultMutation = useSetDefaultCurrency();
  const toggleStatusMutation = useToggleCurrencyStatus();

  const handleEdit = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedCurrency(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedCurrency(null);
  };

  const handleDelete = (id: number) => {
    setCurrencyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (currencyToDelete) {
      deleteMutation.mutate(currencyToDelete, {
        onSettled: () => {
          setDeleteDialogOpen(false);
          setCurrencyToDelete(null);
        },
      });
    }
  };

  return (
    <PermissionGuard permission="currencies.view">
      <>
        {/* Page Loader */}
        <PageLoader open={isLoading} />

        {/* Mutation overlay (kept exactly same) */}
        {(deleteMutation.isPending ||
          setDefaultMutation.isPending ||
          toggleStatusMutation.isPending) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg shadow-lg border">
              <p className="text-sm font-medium">
                {deleteMutation.isPending && "Deleting currency..."}
                {setDefaultMutation.isPending &&
                  "Setting default currency..."}
                {toggleStatusMutation.isPending &&
                  "Updating currency status..."}
              </p>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Currencies</h1>
                <p className="text-muted-foreground mt-1">
                  Configure currencies, exchange rates and formatting
                </p>
              </div>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Currency
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search currencies..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Exchange Rate</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data?.data?.map((currency) => (
                      <TableRow key={currency.id}>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                            {currency.code}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">
                          {currency.symbol}
                        </TableCell>
                        <TableCell>
                          {parseFloat(String(currency.exchange_rate))}
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-muted-foreground font-mono">
                            {(() => {
                              const dec =
                                currency.decimal_places > 0
                                  ? `${currency.decimal_separator}${"0".repeat(
                                      currency.decimal_places
                                    )}`
                                  : "";
                              const amount = `1${dec}`;
                              const space = currency.space_between
                                ? " "
                                : "";
                              return currency.symbol_position ===
                                "before"
                                ? `${currency.symbol}${space}${amount}`
                                : `${amount}${space}${currency.symbol}`;
                            })()}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Switch
                            checked={Boolean(currency.is_active)}
                            pending={
                              isApprovalRequired(
                                toggleStatusMutation.error
                              ) &&
                              toggleStatusMutation.variables?.id ===
                                currency.id
                            }
                            disabled={
                              currency.is_default ||
                              (toggleStatusMutation.isPending &&
                                toggleStatusMutation.variables?.id ===
                                  currency.id)
                            }
                            onCheckedChange={(checked) =>
                              toggleStatusMutation.mutate({
                                id: currency.id,
                                is_active: checked,
                              })
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <Switch
                            checked={Boolean(currency.is_default)}
                            onCheckedChange={(checked) => {
                              if (checked)
                                setDefaultMutation.mutate(
                                  currency.id
                                );
                            }}
                            disabled={
                              Boolean(currency.is_default) ||
                              !currency.is_active ||
                              setDefaultMutation.isPending
                            }
                          />
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
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
                              onClick={() =>
                                handleDelete(currency.id)
                              }
                              disabled={
                                deleteMutation.isPending ||
                                Boolean(currency.is_default)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {data?.data?.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No currencies found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {data?.pagination &&
                  data.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {data.pagination.page} /{" "}
                        {data.pagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPage((p) => Math.max(1, p - 1))
                          }
                          disabled={!data.pagination.hasPrevPage}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => p + 1)}
                          disabled={!data.pagination.hasNextPage}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialogs remain unchanged */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleDialogClose();
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCurrency ? "Edit Currency" : "Add Currency"}
              </DialogTitle>
              <DialogDescription>
                {selectedCurrency
                  ? "Update currency details and formatting options."
                  : "Add a new currency with exchange rate and formatting options."}
              </DialogDescription>
            </DialogHeader>
            <CurrencyForm
              key={selectedCurrency?.id ?? "new"}
              currency={selectedCurrency}
              onSuccess={handleDialogClose}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete Currency
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this currency?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleteMutation.isPending}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </PermissionGuard>
  );
}