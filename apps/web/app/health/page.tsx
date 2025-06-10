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

  if (isLoading) return <p className="font-mono">Loading...</p>;
  if (error) return <p className="font-mono">Error {error.message}</p>;

  const healthData = health;

  return (
    <div className="flex flex-col gap-2 font-mono">
      {healthData &&
        Object.entries(healthData.services).map(([name, service]) => (
          <div key={name} className="flex flex-col gap-1">
            <h2>
              {name}: {service.status}
            </h2>
            <p>Latency: {service.latency}ms</p>
          </div>
        ))}
    </div>
  );
};

export default HealthStatusPage;
