'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountriesTab } from './_components/countries-tab';
import { StatesTab } from './_components/states-tab';
import { CitiesTab } from './_components/cities-tab';
import { LocalitiesTab } from './_components/localities-tab';

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
        <p className="text-muted-foreground mt-1">
          Manage countries, states, cities and localities
        </p>
      </div>

      <Tabs defaultValue="countries">
        <TabsList>
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="localities">Localities</TabsTrigger>
        </TabsList>

        <TabsContent value="countries" className="mt-4">
          <CountriesTab />
        </TabsContent>
        <TabsContent value="states" className="mt-4">
          <StatesTab />
        </TabsContent>
        <TabsContent value="cities" className="mt-4">
          <CitiesTab />
        </TabsContent>
        <TabsContent value="localities" className="mt-4">
          <LocalitiesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
