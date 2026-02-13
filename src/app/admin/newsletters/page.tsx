"use client";

import { Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NewslettersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Newsletters</h1>
        <p className="text-muted-foreground mt-1">Manage newsletter subscribers and campaigns</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Newsletter Management</h2>
          <p className="text-muted-foreground">This module is under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
