/**
 * Integration Test: API Health Endpoint Contract
 */

export interface HealthResponseContract {
  status: "healthy" | "degraded";
  application: {
    name: string;
    version: string;
    environment: string;
    uptimeSeconds: number;
    timestamp: string;
  };
  database: {
    configured: boolean;
    provider: string;
    status: string;
    message: string;
  };
}
