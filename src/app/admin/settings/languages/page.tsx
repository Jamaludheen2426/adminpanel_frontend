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
import { useLanguages, useDeleteLanguage, useSetDefaultLanguage } from "@/hooks/use-languages";
import { LanguageForm } from "@/components/admin/languages/language-form";
import type { Language } from "@/types";

export default function LanguagesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  const { data, isLoading } = useLanguages({ page, limit: 10, search });
  const deleteLanguageMutation = useDeleteLanguage();
  const setDefaultMutation = useSetDefaultLanguage();

  const handleEdit = (language: Language) => {
    setSelectedLanguage(language);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this language?")) {
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
        <h1 className="text-3xl font-bold">Languages</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedLanguage(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Language
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedLanguage ? "Edit Language" : "Add Language"}</DialogTitle>
              <DialogDescription>
                {selectedLanguage ? "Update the language details below." : "Fill in the details to create a new language."}
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
                placeholder="Search languages..."
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
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Native Name</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          {language.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!language.is_default && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSetDefault(language.id)}
                              disabled={setDefaultMutation.isPending}
                              title="Set as default"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(language)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(language.id)}
                            disabled={deleteLanguageMutation.isPending || language.is_default}
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
                        No languages found
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
