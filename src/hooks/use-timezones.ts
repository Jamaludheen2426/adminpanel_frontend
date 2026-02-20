import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Timezone {
  value: string;
  label: string;
  offset: number;
}

const timezonesApi = {
  getAll: async (): Promise<Timezone[]> => {
    const response = await apiClient.get('/timezones');
    return response.data.data.timezones;
  },
};

export function useTimezones() {
  return useQuery({
    queryKey: ['timezones'],
    queryFn: timezonesApi.getAll,
    staleTime: 60 * 60 * 1000, // 1 hour - timezones don't change
  });
}
