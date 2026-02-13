"use client";

import { useState } from "react";
import { isApprovalRequired } from "@/lib/api-client";
import Link from "next/link";
import { Plus, Search, RefreshCw, Check, AlertCircle, Minus, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
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
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, missing, auto, reviewed
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<TranslationKey | null>(null);
  const [customGroup, setCustomGroup] = useState("");

  // Form state for new key
  const [newKey, setNewKey] = useState({
    key: "",
    default_value: "",
    description: "",
    group: "",
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

  // Filter languages to display in table (exclude default/English since it's shown as "English (Original)")
  const nonDefaultLanguages = languages.filter(l => !l.is_default);
  const displayLanguages = selectedLanguageId === "all"
    ? nonDefaultLanguages
    : nonDefaultLanguages.filter(l => l.id.toString() === selectedLanguageId);

  const handleCreateKey = () => {
    const groupToUse = newKey.group === "__custom__" ? customGroup : newKey.group;
    const closeAdd = () => {
      setIsAddDialogOpen(false);
      setNewKey({ key: "", default_value: "", description: "", group: "", auto_translate: true });
      setCustomGroup("");
    };
    createKeyMutation.mutate({ ...newKey, group: groupToUse }, {
      onSuccess: closeAdd,
      onError: (e) => { if (isApprovalRequired(e)) closeAdd(); },
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

    const closeEdit = () => { setIsEditDialogOpen(false); setSelectedKey(null); setEditTranslations({}); };
    updateTranslationsMutation.mutate(
      { id: selectedKey.id, translations },
      {
        onSuccess: closeEdit,
        onError: (e) => { if (isApprovalRequired(e)) closeEdit(); },
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

  // Filter data by status
  const filteredData = data?.data?.filter((key) => {
    if (statusFilter === "all") return true;

    // Check status for displayed languages
    const languagesToCheck = displayLanguages.length > 0 ? displayLanguages : nonDefaultLanguages;

    for (const lang of languagesToCheck) {
      const status = getTranslationStatus(key, lang);
      if (statusFilter === "missing" && status.status === "missing") return true;
      if (statusFilter === "auto" && status.status === "auto") return true;
      if (statusFilter === "reviewed" && status.status === "reviewed") return true;
    }

    return false;
  }) || [];

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-12 w-12" />
          <p className="text-sm text-muted-foreground">Loading translations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading Overlay - Shows when performing mutations */}
      {(createKeyMutation.isPending || deleteKeyMutation.isPending || updateTranslationsMutation.isPending || retranslateAllMutation.isPending) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg shadow-lg border">
            <Spinner className="h-12 w-12" />
            <p className="text-sm font-medium">
              {createKeyMutation.isPending && "Creating translation key..."}
              {deleteKeyMutation.isPending && "Deleting translation key..."}
              {updateTranslationsMutation.isPending && "Saving translations..."}
              {retranslateAllMutation.isPending && "Re-translating..."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.translations')}</h1>
            <p className="text-muted-foreground">{t('settings.translations_desc')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/settings/translations/missing">
              <Button variant="outline">
                <AlertTriangle className="mr-2 h-4 w-4" />
                {t('translations.missing_keys', 'Missing Keys')}
                {missingCount && missingCount.unresolved > 0 && (
                  <Badge variant="destructive" className="ml-2">{missingCount.unresolved}</Badge>
                )}
              </Button>
            </Link>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('translations.add_key', 'Add Key')}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('translations.add_key_title', 'Add Translation Key')}</DialogTitle>
                <DialogDescription>
                  {t('translations.add_key_desc', 'Create a new translation key. It will be auto-translated to all active languages.')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('translations.key', 'Key')}</Label>
                  <Input
                    placeholder="common.save"
                    value={newKey.key}
                    onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">{t('translations.key_format', 'Format: group.key_name')}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t('translations.default_value', 'Default Value (English)')}</Label>
                  <Textarea
                    placeholder="Save"
                    value={newKey.default_value}
                    onChange={(e) => setNewKey({ ...newKey, default_value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.description', 'Description')} ({t('common.optional', 'Optional')})</Label>
                  <Input
                    placeholder={t('translations.description_placeholder', 'Help text for translators')}
                    value={newKey.description}
                    onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('translations.group', 'Group')}</Label>
                  <Select value={newKey.group} onValueChange={(v) => setNewKey({ ...newKey, group: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('translations.select_group', 'Select a group')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {groups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group.charAt(0).toUpperCase() + group.slice(1)}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">+ {t('translations.new_group', 'New Group')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {newKey.group === "__custom__" && (
                    <Input
                      placeholder={t('translations.enter_group_name', 'Enter group name')}
                      value={customGroup}
                      onChange={(e) => setCustomGroup(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      className="mt-2"
                    />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_translate"
                    checked={newKey.auto_translate}
                    onCheckedChange={(checked) =>
                      setNewKey({ ...newKey, auto_translate: checked as boolean })
                    }
                  />
                  <Label htmlFor="auto_translate">{t('translations.auto_translate', 'Auto-translate to all languages')}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleCreateKey}
                  disabled={createKeyMutation.isPending || !newKey.key || !newKey.default_value || !newKey.group || (newKey.group === "__custom__" && !customGroup)}
                >
                  {createKeyMutation.isPending ? t('common.loading') : t('common.create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Missing Keys Alert */}
        {missingCount && missingCount.unresolved > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">
                    {missingCount.unresolved} {t('translations.missing_keys_detected', 'Missing Keys Detected')}
                  </CardTitle>
                </div>
                <Link href="/admin/settings/translations/missing">
                  <Button variant="outline" size="sm">
                    {t('translations.view_resolve', 'View & Resolve')}
                  </Button>
                </Link>
              </div>
              <CardDescription>
                {t('translations.missing_keys_desc', "Translation keys are being used that don't exist in the system. Click to review and create them.")}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Stats Section - Horizontal Scrollable */}
        {stats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">{t('translations.completion_stats', 'Completion Statistics')}</h2>
              <span className="text-xs text-muted-foreground">{languages.length} {t('translations.languages', 'languages')}</span>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {/* Total Keys Card */}
                <Card className="flex-shrink-0 w-[160px]">
                  <CardHeader className="p-4">
                    <CardDescription className="text-xs">{t('translations.total_keys', 'Total Keys')}</CardDescription>
                    <CardTitle className="text-2xl">{stats.total_keys}</CardTitle>
                  </CardHeader>
                </Card>

                {/* Language Stats Cards */}
                {stats.languages.map((lang) => (
                  <Card
                    key={lang.id}
                    className={`flex-shrink-0 w-[180px] cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedLanguageId === lang.id.toString() ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedLanguageId(
                      selectedLanguageId === lang.id.toString() ? "all" : lang.id.toString()
                    )}
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardDescription className="text-xs truncate">{lang.name}</CardDescription>
                      <CardTitle className="text-xl flex items-center gap-1">
                        {lang.completion}%
                        <span className="text-xs font-normal text-muted-foreground">
                          ({lang.total}/{stats.total_keys})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px]">
                        <span className="text-green-500">{lang.reviewed} ✓</span>
                        <span className="text-yellow-500">{lang.auto} ⚡</span>
                        <span className="text-red-500">{lang.missing} ✗</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Main Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('translations.search_placeholder', 'Search by English text or key...')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder={t('translations.filter_group', 'Group')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('translations.all_groups', 'All Groups')}</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group.charAt(0).toUpperCase() + group.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLanguageId} onValueChange={setSelectedLanguageId}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t('translations.filter_language', 'Language')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('translations.all_languages', 'All Languages')}</SelectItem>
                    {nonDefaultLanguages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id.toString()}>
                        {lang.native_name || lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder={t('translations.filter_status', 'Status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('translations.all_status', 'All Status')}</SelectItem>
                    <SelectItem value="missing">{t('translations.status_missing', '✗ Missing')}</SelectItem>
                    <SelectItem value="auto">{t('translations.status_auto', '⚡ Auto')}</SelectItem>
                    <SelectItem value="reviewed">{t('translations.status_reviewed', '✓ Reviewed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">{t('translations.key', 'Key')}</TableHead>
                    <TableHead className="min-w-[200px]">{t('translations.english_original', 'English (Original)')}</TableHead>
                    {displayLanguages.map((lang) => (
                      <TableHead key={lang.id} className="min-w-[200px]">
                        {lang.native_name || lang.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-right min-w-[100px] sticky right-0 bg-background z-10">{t('common.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="sticky left-0 bg-background z-10">
                        <div className="flex flex-col gap-1">
                          <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[160px]" title={key.key}>
                            {key.key}
                          </code>
                          <Badge variant="outline" className="text-[10px] w-fit">
                            {key.group}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="line-clamp-2 text-sm" title={key.default_value}>
                          {key.default_value}
                        </span>
                      </TableCell>
                      {displayLanguages.map((lang) => {
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
                            <div className="flex items-start gap-2">
                              <StatusIcon className={`h-3 w-3 flex-shrink-0 mt-1 ${status.color}`} />
                              <span className="line-clamp-2 text-sm" dir={lang.direction}>
                                {value || <span className="text-muted-foreground italic">Missing</span>}
                              </span>
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right sticky right-0 bg-background z-10">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRetranslate(key.id)}
                            disabled={retranslateAllMutation.isPending}
                            title={t('translations.retranslate', 'Re-translate all')}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditKey(key)}
                            title={t('common.edit', 'Edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteKey(key.id)}
                            disabled={deleteKeyMutation.isPending}
                            title={t('common.delete', 'Delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3 + displayLanguages.length} className="text-center py-8 text-muted-foreground">
                        {statusFilter !== "all"
                          ? t('translations.no_keys_with_status', 'No translation keys found with this status')
                          : t('translations.no_keys_found', 'No translation keys found')
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
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
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('common.previous', 'Previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.pagination.hasNextPage}
                  >
                    {t('common.next', 'Next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Translations Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('translations.edit_translations', 'Edit Translations')}</DialogTitle>
              <DialogDescription>
                <code className="bg-muted px-2 py-1 rounded">{selectedKey?.key}</code>
              </DialogDescription>
            </DialogHeader>
            {selectedKey && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('translations.english_default', 'English (Default)')}</Label>
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
                      placeholder={`${t('translations.translation_in', 'Translation in')} ${lang.name}`}
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
    </>
  );
}