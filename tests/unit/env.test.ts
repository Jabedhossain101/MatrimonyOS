/**
 * Unit Test: Environment Configuration Contract
 */

export function testEnvironmentContract() {
  const requiredKeys = [
    "DATABASE_URL",
    "DIRECT_URL",
    "AUTH_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ];
  return requiredKeys;
}
