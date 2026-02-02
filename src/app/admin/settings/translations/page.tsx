"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, Check, AlertCircle, Minus, Pencil, Trash2, AlertTriangle } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useTranslationKeys,
  useTranslationStats,
  useTranslationGroups,
  useCreateTranslationKey,
  useDeleteTranslationKey,
  useUpdateTranslations,
  useRetranslateKeyToAll,
  useMissingTranslationKeysCount,
} from "@/hooks/use-translations";
import { useActiveLanguages } from "@/hooks/use-languages";
import { useTranslation } from "@/hooks/use-translation";
import type { TranslationKey, Language } from "@/types";

export default function TranslationsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<TranslationKey | null>(null);

  // Form state for new key
  const [newKey, setNewKey] = useState({
    key: "",
    default_value: "",
    description: "",
    group: "common",
    auto_translate: true,
  });

  // Edit translations state
  const [editTranslations, setEditTranslations] = useState<Record<number, string>>({});

  // Queries
  const { data: languages = [] } = useActiveLanguages();
  const { data: stats } = useTranslationStats();
  const { data: groups = [] } = useTranslationGroups();
  const { data: missingCount } = useMissingTranslationKeysCount();
  const { data, isLoading } = useTranslationKeys({
    page,
    limit: 20,
    search,
    group: groupFilter !== "all" ? groupFilter : undefined,
  });

  // Mutations
  const createKeyMutation = useCreateTranslationKey();
  const deleteKeyMutation = useDeleteTranslationKey();
  const updateTranslationsMutation = useUpdateTranslations();
  const retranslateAllMutation = useRetranslateKeyToAll();

  const handleCreateKey = () => {
    createKeyMutation.mutate(newKey, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewKey({
          key: "",
          default_value: "",
          description: "",
          group: "common",
          auto_translate: true,
        });
      },
    });
  };

  const handleEditKey = (key: TranslationKey) => {
    setSelectedKey(key);
    // Initialize edit translations state
    const translationValues: Record<number, string> = {};
    key.translations?.forEach((t) => {
      translationValues[t.language_id] = t.value;
    });
    setEditTranslations(translationValues);
    setIsEditDialogOpen(true);
  };

  const handleSaveTranslations = () => {
    if (!selectedKey) return;

    const translations = Object.entries(editTranslations).map(([langId, value]) => ({
      language_id: parseInt(langId),
      value,
    }));

    updateTranslationsMutation.mutate(
      { id: selectedKey.id, translations },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedKey(null);
          setEditTranslations({});
        },
      }
    );
  };

  const handleDeleteKey = (id: number) => {
    if (confirm("Are you sure you want to delete this translation key?")) {
      deleteKeyMutation.mutate(id);
    }
  };

  const handleRetranslate = (id: number) => {
    retranslateAllMutation.mutate(id);
  };

  const getTranslationStatus = (key: TranslationKey, language: Language) => {
    const translation = key.translations?.find((t) => t.language_id === language.id);
    if (!translation) {
      return { status: "missing", icon: Minus, color: "text-red-500" };
    }
    if (translation.status === "reviewed") {
      return { status: "reviewed", icon: Check, color: "text-green-500" };
    }
    return { status: "auto", icon: AlertCircle, color: "text-yellow-500" };
  };

  const getTranslationValue = (key: TranslationKey, languageId: number) => {
    const translation = key.translations?.find((t) => t.language_id === languageId);
    return translation?.value || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.translations')}</h1>
          <p className="text-muted-foreground">{t('settings.translations_desc')}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Translation Key</DialogTitle>
              <DialogDescription>
                Create a new translation key. It will be auto-translated to all active languages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  placeholder="common.save"
                  value={newKey.key}
                  onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Format: group.key_name</p>
              </div>
              <div className="space-y-2">
                <Label>Default Value (English)</Label>
                <Textarea
                  placeholder="Save"
                  value={newKey.default_value}
                  onChange={(e) => setNewKey({ ...newKey, default_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="Help text for translators"
                  value={newKey.description}
                  onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Select value={newKey.group} onValueChange={(v) => setNewKey({ ...newKey, group: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="auth">Auth</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="roles">Roles</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                    <SelectItem value="navigation">Navigation</SelectItem>
                    <SelectItem value="errors">Errors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto_translate"
                  checked={newKey.auto_translate}
                  onCheckedChange={(checked) =>
                    setNewKey({ ...newKey, auto_translate: checked as boolean })
                  }
                />
                <Label htmlFor="auto_translate">Auto-translate to all languages</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreateKey} disabled={createKeyMutation.isPending}>
                {createKeyMutation.isPending ? t('common.loading') : t('common.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Missing Keys Alert */}
      {missingCount && missingCount.unresolved > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">
                  {missingCount.unresolved} Missing Keys Detected
                </CardTitle>
              </div>
              <Link href="/admin/settings/translations/missing">
                <Button variant="outline" size="sm">
                  View & Resolve
                </Button>
              </Link>
            </div>
            <CardDescription>
              Translation keys are being used that don&apos;t exist in the system. Click to review and create them.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Keys</CardDescription>
              <CardTitle className="text-2xl">{stats.total_keys}</CardTitle>
            </CardHeader>
          </Card>
          {stats.languages.map((lang) => (
            <Card key={lang.id}>
              <CardHeader className="pb-2">
                <CardDescription>{lang.name}</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {lang.completion}%
                  <span className="text-sm font-normal text-muted-foreground">
                    ({lang.total}/{stats.total_keys})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2 text-xs">
                  <span className="text-green-500">{lang.reviewed} reviewed</span>
                  <span className="text-yellow-500">{lang.auto} auto</span>
                  <span className="text-red-500">{lang.missing} missing</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by English text or key..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Key</TableHead>
                    <TableHead className="w-[200px]">English (Original)</TableHead>
                    {languages.map((lang) => (
                      <TableHead key={lang.id} className="w-[200px]">
                        {lang.native_name || lang.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>
                        <div>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{key.key}</code>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {key.group}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={key.default_value}>
                        {key.default_value}
                      </TableCell>
                      {languages.map((lang) => {
                        const status = getTranslationStatus(key, lang);
                        const StatusIcon = status.icon;
                        const value = getTranslationValue(key, lang.id);
                        return (
                          <TableCell
                            key={lang.id}
                            className="max-w-[200px] cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleEditKey(key)}
                            title={`Click to edit - Status: ${status.status}`}
                          >
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-3 w-3 flex-shrink-0 ${status.color}`} />
                              <span className="truncate text-sm" dir={lang.direction}>
                                {value || <span className="text-muted-foreground italic">Missing</span>}
                              </span>
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRetranslate(key.id)}
                            disabled={retranslateAllMutation.isPending}
                            title="Re-translate all"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditKey(key)}
                            title="Edit translations"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKey(key.id)}
                            disabled={deleteKeyMutation.isPending}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.data?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3 + languages.length} className="text-center py-8 text-muted-foreground">
                        No translation keys found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!data.pagination.hasPrevPage}
                    >
                      {t('common.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!data.pagination.hasNextPage}
                    >
                      {t('common.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Translations Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Translations</DialogTitle>
            <DialogDescription>
              <code className="bg-muted px-2 py-1 rounded">{selectedKey?.key}</code>
            </DialogDescription>
          </DialogHeader>
          {selectedKey && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>English (Default)</Label>
                <div className="p-3 bg-muted rounded-md text-sm">{selectedKey.default_value}</div>
              </div>
              {languages.map((lang) => (
                <div key={lang.id} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {lang.name}
                    {(() => {
                      const status = getTranslationStatus(selectedKey, lang);
                      const StatusIcon = status.icon;
                      return <StatusIcon className={`h-4 w-4 ${status.color}`} />;
                    })()}
                  </Label>
                  <Textarea
                    value={editTranslations[lang.id] || getTranslationValue(selectedKey, lang.id)}
                    onChange={(e) =>
                      setEditTranslations({ ...editTranslations, [lang.id]: e.target.value })
                    }
                    placeholder={`Translation in ${lang.name}`}
                    dir={lang.direction}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveTranslations} disabled={updateTranslationsMutation.isPending}>
              {updateTranslationsMutation.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
