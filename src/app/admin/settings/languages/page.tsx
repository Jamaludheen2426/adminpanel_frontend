"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Star, Languages } from "lucide-react";
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
import { useLanguages, useDeleteLanguage, useSetDefaultLanguage } from "@/hooks/use-languages";
import { LanguageForm } from "@/components/admin/languages/language-form";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateAllToLanguage } from "@/hooks/use-translations";
import type { Language } from "@/types";

export default function LanguagesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  const { data, isLoading } = useLanguages({ page, limit: 10, search });
  const deleteLanguageMutation = useDeleteLanguage();
  const setDefaultMutation = useSetDefaultLanguage();
  const translateAllMutation = useTranslateAllToLanguage();

  const handleTranslateAll = (languageId: number, languageName: string) => {
    if (confirm(t('languages.translate_all_confirm', `Generate translations for all keys to ${languageName}?`))) {
      translateAllMutation.mutate(languageId);
    }
  };

  const handleEdit = (language: Language) => {
    setSelectedLanguage(language);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('languages.delete_confirm'))) {
      deleteLanguageMutation.mutate(id);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('languages.title')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedLanguage(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('languages.add_language')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedLanguage ? t('languages.edit_language') : t('languages.add_language')}</DialogTitle>
              <DialogDescription>
                {selectedLanguage ? t('languages.edit_desc') : t('languages.add_desc')}
              </DialogDescription>
            </DialogHeader>
            <LanguageForm language={selectedLanguage} onSuccess={handleDialogClose} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('languages.search')}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.code')}</TableHead>
                    <TableHead>{t('languages.native_name')}</TableHead>
                    <TableHead>{t('languages.direction')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((language) => (
                    <TableRow key={language.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {language.name}
                          {language.is_default && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {language.code}
                        </code>
                      </TableCell>
                      <TableCell>{language.native_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{language.direction.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={language.is_active ? "default" : "secondary"}>
                          {language.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTranslateAll(language.id, language.name)}
                            disabled={translateAllMutation.isPending}
                            title={t('languages.translate_all', 'Translate all keys')}
                          >
                            <Languages className="h-4 w-4" />
                          </Button>
                          {!language.is_default && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSetDefault(language.id)}
                              disabled={setDefaultMutation.isPending}
                              title={t('languages.set_default', 'Set as default')}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(language)}
                            title={t('common.edit', 'Edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(language.id)}
                            disabled={deleteLanguageMutation.isPending || language.is_default}
                            title={t('common.delete', 'Delete')}
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
                        {t('languages.no_languages_found')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('common.page')} {data.pagination.page} / {data.pagination.totalPages}
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
    </div>
  );
}
