"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Star,
  Languages,
} from "lucide-react";
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
  useLanguages,
  useDeleteLanguage,
  useSetDefaultLanguage,
} from "@/hooks/use-languages";
import { LanguageForm } from "@/components/admin/languages/language-form";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateAllToLanguage } from "@/hooks/use-translations";
import { Progress } from "@/components/ui/progress";
import type { Language } from "@/types";
import { useToggleLanguageStatus } from "@/hooks/use-languages";
import { Switch } from "@/components/ui/switch";
import { isApprovalRequired } from "@/lib/api-client";
import { HelpCircle } from "lucide-react";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PageLoader } from '@/components/common/page-loader';

export function LanguagesContent() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [translateDialogOpen, setTranslateDialogOpen] = useState(false);
  const [languageToDelete, setLanguageToDelete] = useState<number | null>(null);
  const [languageToTranslate, setLanguageToTranslate] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const { data, isLoading } = useLanguages({ page, limit: 10, search });
  const deleteLanguageMutation = useDeleteLanguage();
  const setDefaultMutation = useSetDefaultLanguage();
  const translateAllMutation = useTranslateAllToLanguage();
  const toggleStatusMutation = useToggleLanguageStatus();

  const [translateProgress, setTranslateProgress] = useState(0);

  useEffect(() => {
    if (translateAllMutation.isPending) {
      setTranslateProgress(0);
      const interval = setInterval(() => {
        setTranslateProgress((prev) => {
          if (prev >= 95) return prev;
          if (prev >= 80) return prev + 0.5;
          if (prev >= 60) return prev + 1;
          return prev + 2;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      if (translateProgress > 0) {
        setTranslateProgress(100);
        setTimeout(() => setTranslateProgress(0), 500);
      }
    }
  }, [translateAllMutation.isPending]);

  const handleTranslateAll = (languageId: number, languageName: string) => {
    setLanguageToTranslate({ id: languageId, name: languageName });
    setTranslateDialogOpen(true);
  };

  const confirmTranslateAll = () => {
    if (languageToTranslate) {
      setTranslateDialogOpen(false);
      translateAllMutation.mutate(languageToTranslate.id, {
        onSettled: () => {
          setLanguageToTranslate(null);
        },
      });
    }
  };

  const handleEdit = (language: Language) => {
    setSelectedLanguage(language);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setLanguageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (languageToDelete) {
      deleteLanguageMutation.mutate(languageToDelete, {
        onSettled: () => {
          setDeleteDialogOpen(false);
          setLanguageToDelete(null);
        },
      });
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedLanguage(null);
  };

  return (
    <PermissionGuard permission="languages.view">
      <>
        <PageLoader open={isLoading} />
        <PageLoader open={
          deleteLanguageMutation.isPending ||
          setDefaultMutation.isPending ||
          toggleStatusMutation.isPending ||
          translateAllMutation.isPending
        } />

        {!isLoading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{t("languages.title")}</h1>
              <div className="flex items-center gap-2">
                {/* HELP BUTTON */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Language Settings Help</DialogTitle>
                      <DialogDescription>
                        Understand each field before adding a language.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-semibold">Name</p>
                        <p className="text-muted-foreground">
                          Display name shown to users (Example: English).
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Code</p>
                        <p className="text-muted-foreground">
                          Short ISO code like <b>en</b>, <b>ar</b>, <b>fr</b>.
                        </p>
                        
                    <a
                          href="https://www.loc.gov/standards/iso639-2/php/code_list.php"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 underline text-xs mt-1 inline-block"
                        >
📋 Find your language code here &#8594;                        </a>
                      </div>
                      <div>
                        <p className="font-semibold">Native Name</p>
                        <p className="text-muted-foreground">
                          Language written in its own format ( العربية ).
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Direction</p>
                        <p className="text-muted-foreground">
                          LTR → English RTL → Arabic
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Default Language</p>
                        <p className="text-muted-foreground">
                          Main language of the system. Cannot be disabled.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Active</p>
                        <p className="text-muted-foreground">
                          Only active languages are visible to users.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* ADD LANGUAGE */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedLanguage(null)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("languages.add_language")}
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedLanguage
                          ? t("languages.edit_language")
                          : t("languages.add_language")}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedLanguage
                          ? t("languages.edit_desc")
                          : t("languages.add_desc")}
                      </DialogDescription>
                    </DialogHeader>

                    <LanguageForm
                      language={selectedLanguage}
                      onSuccess={handleDialogClose}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("languages.search")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("common.code")}</TableHead>
                      <TableHead>{t("languages.native_name")}</TableHead>
                      <TableHead>{t("languages.direction")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="text-right">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data?.map((language) => (
                      <TableRow key={language.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {language.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {language.code}
                          </code>
                        </TableCell>
                        <TableCell>{language.native_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {language.direction.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={language.is_active}
                            pending={isApprovalRequired(toggleStatusMutation.error) && toggleStatusMutation.variables?.id === language.id}
                            disabled={
                              language.is_default ||
                              (toggleStatusMutation.isPending &&
                                toggleStatusMutation.variables?.id === language.id)
                            }
                            onCheckedChange={(checked) => {
                              toggleStatusMutation.mutate({
                                id: language.id,
                                is_active: checked,
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                handleTranslateAll(language.id, language.name)
                              }
                              disabled={translateAllMutation.isPending}
                              title={t("languages.translate_all", "Translate all keys")}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Languages className="h-4 w-4 mr-1" />
                              Translate
                            </Button>

                            {!language.is_default ? (
                              <Button
                                size="sm"
                                onClick={() => handleSetDefault(language.id)}
                                disabled={setDefaultMutation.isPending}
                                title={t("languages.set_default", "Set as default")}
                                className="bg-yellow-500 hover:bg-blue-600 text-white"
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Default
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={true}
                                title="This is the default language"
                                className="bg-yellow-500 text-white cursor-not-allowed opacity-100 hover:bg-yellow-500"
                              >
                                <Star className="h-4 w-4 mr-1 fill-white" />
                                Default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(language)}
                              title={t("common.edit", "Edit")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleDelete(language.id)}
                              disabled={
                                deleteLanguageMutation.isPending ||
                                language.is_default
                              }
                              title={t("common.delete", "Delete")}
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
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {t("languages.no_languages_found")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {data?.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      {t("common.page", "Page")} {data.pagination.page} /{" "}
                      {data.pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!data.pagination.hasPrevPage}
                      >
                        {t("common.previous", "Previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!data.pagination.hasNextPage}
                      >
                        {t("common.next", "Next")}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("languages.delete_title", "Delete Language")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      "languages.delete_confirm",
                      "Are you sure you want to delete this language? This will also deactivate all translations for this language.",
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteLanguageMutation.isPending}>
                    {t("common.cancel", "Cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    disabled={deleteLanguageMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("common.delete", "Delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Translate All Confirmation Dialog */}
            <AlertDialog
              open={translateDialogOpen}
              onOpenChange={(open) => {
                if (!translateAllMutation.isPending) {
                  setTranslateDialogOpen(open);
                  if (!open) setLanguageToTranslate(null);
                }
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("languages.translate_all_title", "Translate All Keys")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      "languages.translate_all_confirm",
                      `Generate translations for all keys to ${languageToTranslate?.name || ""}?`,
                    ).replace("${languageName}", languageToTranslate?.name || "")}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {translateAllMutation.isPending && (
                  <div className="space-y-3 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {t(
                        "languages.translating_progress",
                        "Translating... This may take a while for large datasets.",
                      )}
                    </div>
                    <Progress value={translateProgress} className="h-3" />
                    <p className="text-sm font-medium text-center">
                      {Math.round(translateProgress)}%
                    </p>
                  </div>
                )}

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={translateAllMutation.isPending}>
                    {t("common.cancel", "Cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmTranslateAll}
                    disabled={translateAllMutation.isPending}
                  >
                    {translateAllMutation.isPending
                      ? t("languages.translating", "Translating...")
                      : t("languages.translate_all", "Translate All")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </>
    </PermissionGuard>
  );
}