'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountriesTab } from '@/app/admin/locations/_components/countries-tab';
import { StatesTab } from '@/app/admin/locations/_components/states-tab';
import { CitiesTab } from '@/app/admin/locations/_components/cities-tab';
import { LocalitiesTab } from '@/app/admin/locations/_components/localities-tab';
import { PermissionGuard } from '@/components/guards/permission-guard';
import { useTranslation } from '@/hooks/use-translation';

export function LocationsContent() {
  const { t } = useTranslation();

  return (
    <PermissionGuard permission="locations.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.locations', 'Locations')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('settings.locations_desc', 'Manage countries, states, districts and cities')}
          </p>
        </div>

        <Tabs defaultValue="countries">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="countries">{t('locations.countries', 'Countries')}</TabsTrigger>
            <TabsTrigger value="states">{t('locations.states', 'States')}</TabsTrigger>
            <TabsTrigger value="cities">{t('locations.districts', 'Districts')}</TabsTrigger>
            <TabsTrigger value="localities">{t('locations.cities', 'Cities')}</TabsTrigger>
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
    </PermissionGuard>
  );
}
