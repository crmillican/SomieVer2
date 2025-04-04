import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface GeolocationData {
  city: string | null;
  region: string | null;
  country: string | null;
  coordinates: [number, number] | null;
  timezone: string | null;
}

/**
 * Hook for getting the user's location based on their IP address.
 * This is non-blocking and doesn't require user permission.
 */
export function useGeolocation() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/geolocation'],
    queryFn: getQueryFn({ on401: "returnNull" }), // Continue with null if not authenticated
    staleTime: 1000 * 60 * 60, // 1 hour - location doesn't change often
    retry: 1, // Only retry once
    refetchOnWindowFocus: false, // Don't refetch when window gets focus
    refetchOnReconnect: false, // Don't refetch on reconnect to prevent errors
  });

  return {
    location: data as GeolocationData | undefined,
    isLoading,
    error,
  };
}