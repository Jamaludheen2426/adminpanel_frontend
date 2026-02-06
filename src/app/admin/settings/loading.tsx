import { Spinner } from "@/components/ui/spinner";

export default function SettingsLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-12 w-12" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
