"use client";

import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Locations</h1>
        <p className="text-muted-foreground mt-1">Manage countries, states, cities</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Locations Management</h2>
          <p className="text-muted-foreground">This module is under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
