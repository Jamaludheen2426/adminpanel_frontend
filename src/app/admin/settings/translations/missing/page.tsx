"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  EyeOff,
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  useMissingTranslationKeys,
  useMissingTranslationKeysCount,
  useCreateKeyFromMissing,
  useCreateAllMissingKeys,
  useDeleteMissingKey,
  useIgnoreMissingKey,
  useTranslationGroups,
  type MissingTranslationKey,
} from "@/hooks/use-translations";
import { useTranslation } from "@/hooks/use-translation";
import { formatDistanceToNow } from "date-fns";

export default function MissingTranslationsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<MissingTranslationKey | null>(null);
  const [createForm, setCreateForm] = useState({
    group: "common",
    description: "",
  });

  // Queries
  const { data: countData } = useMissingTranslationKeysCount();
  const { data, isLoading } = useMissingTranslationKeys({ page, limit: 20 });
  const { data: groups = [] } = useTranslationGroups();

  // Mutations
  const createFromMissingMutation = useCreateKeyFromMissing();
  const createAllMutation = useCreateAllMissingKeys();
  const deleteMutation = useDeleteMissingKey();
  const ignoreMutation = useIgnoreMissingKey();

  const handleCreateFromMissing = (key: MissingTranslationKey) => {
    setSelectedKey(key);
    // Auto-detect group from key pattern
    const keyParts = key.key.split(".");
    if (keyParts.length > 1) {
      setCreateForm({ ...createForm, group: keyParts[0] });
    }
    setIsCreateDialogOpen(true);
  };

  const handleConfirmCreate = () => {
    if (!selectedKey) return;
    createFromMissingMutation.mutate(
      { id: selectedKey.id, data: createForm },
      {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          setSelectedKey(null);
          setCreateForm({ group: "common", description: "" });
        },
      }
    );
  };

  const handleCreateAll = () => {
    if (confirm(`This will create ${countData?.unresolved || 0} translation keys and auto-translate them. Continue?`)) {
      createAllMutation.mutate();
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this missing key entry?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleIgnore = (id: number) => {
    ignoreMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-12 w-12" />
          <p className="text-sm text-muted-foreground">Loading missing translation keys...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading Overlay - Shows when performing mutations */}
      {(createFromMissingMutation.isPending || createAllMutation.isPending || deleteMutation.isPending || ignoreMutation.isPending) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg shadow-lg border">
            <Spinner className="h-12 w-12" />
            <p className="text-sm font-medium">
              {createFromMissingMutation.isPending && "Creating translation key..."}
              {createAllMutation.isPending && "Creating all translation keys..."}
              {deleteMutation.isPending && "Deleting missing key..."}
              {ignoreMutation.isPending && "Ignoring missing key..."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/settings/translations")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Missing Translation Keys</h1>
              <p className="text-muted-foreground">
                Auto-detected keys that need to be added to the translation system
              </p>
            </div>
          </div>
          {countData && countData.unresolved > 0 && (
            <Button onClick={handleCreateAll} disabled={createAllMutation.isPending}>
              <Sparkles className="mr-2 h-4 w-4" />
              {createAllMutation.isPending
                ? "Creating..."
                : `Create All (${countData.unresolved})`}
            </Button>
          )}
        </div>

        {/* Alert Card */}
        {countData && countData.unresolved > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">
                  {countData.unresolved} Missing Keys Detected
                </CardTitle>
              </div>
              <CardDescription>
                These keys were used in the application but don&apos;t exist in the translation system.
                Create them individually or use &quot;Create All&quot; to add them with auto-translation.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Main Table */}
        <Card>
          <CardHeader>
            <CardTitle>Missing Keys</CardTitle>
            <CardDescription>
              Keys are automatically reported when {"`t('key')`"} is called but the key doesn&apos;t exist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Default Value</TableHead>
                  <TableHead>Page URL</TableHead>
                  <TableHead className="text-center">Reports</TableHead>
                  <TableHead>Last Reported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.map((item) => (
                  <TableRow key={item.id} className={item.is_resolved ? "opacity-50" : ""}>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {item.key}
                      </code>
                      {item.is_resolved && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Ignored
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.default_value || ""}>
                      {item.default_value || (
                        <span className="text-muted-foreground italic">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.page_url ? (
                        <a
                          href={item.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                        >
                          {item.page_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.report_count > 10 ? "destructive" : "secondary"}>
                        {item.report_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.last_reported_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!item.is_resolved && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCreateFromMissing(item)}
                              title="Create translation key"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleIgnore(item.id)}
                              disabled={ignoreMutation.isPending}
                              title="Ignore (mark as resolved)"
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!data?.data || data.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No missing translation keys found
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

        {/* Create from Missing Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Translation Key</DialogTitle>
              <DialogDescription>
                Create a new translation key from this missing key entry. It will be auto-translated to all active languages.
              </DialogDescription>
            </DialogHeader>
            {selectedKey && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Key</Label>
                  <code className="block text-sm bg-muted px-3 py-2 rounded">
                    {selectedKey.key}
                  </code>
                </div>
                <div className="space-y-2">
                  <Label>Default Value (English)</Label>
                  <div className="text-sm bg-muted px-3 py-2 rounded">
                    {selectedKey.default_value || selectedKey.key}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Group</Label>
                  <Select
                    value={createForm.group}
                    onValueChange={(v) => setCreateForm({ ...createForm, group: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {groups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group.charAt(0).toUpperCase() + group.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input
                    placeholder="Help text for translators"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                onClick={handleConfirmCreate}
                disabled={createFromMissingMutation.isPending}
              >
                {createFromMissingMutation.isPending ? "Creating..." : "Create & Translate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}