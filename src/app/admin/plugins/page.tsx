"use client";

import { Puzzle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PluginsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plugins</h1>
        <p className="text-muted-foreground mt-1">Manage installed plugins and extensions</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <Puzzle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Plugin Management</h2>
          <p className="text-muted-foreground">This module is under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
