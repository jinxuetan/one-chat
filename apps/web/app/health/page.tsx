"use client";

import { trpc } from "@/lib/trpc/client";

const HealthStatusPage = () => {
  const {
    data: health,
    isLoading,
    error,
  } = trpc.health.health.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes (gcTime replaces cacheTime in React Query v5)
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error {error.message}</p>;

  const healthData = health;

  return (
    <>
      {healthData &&
        Object.entries(healthData.services).map(([name, service], i) => (
          <div key={name}>
            <h2>
              {name}: {service.status}
            </h2>
            <p>Latency: {service.latency}ms</p>
            {i < Object.entries(healthData.services).length - 1 && (
              <p>------------------</p>
            )}
          </div>
        ))}
    </>
  );
};

export default HealthStatusPage;
