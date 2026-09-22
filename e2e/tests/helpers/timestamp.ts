/** Phase 0 helper — unique stamped identifiers to avoid DB collisions when workers:1 */
export const getTimestamp = () => `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
export const uniqueEmail = (prefix: string) => `${prefix}_${getTimestamp()}@example.com`;
export const uniqueCompanyEmail = (prefix: string) => `${prefix}_${getTimestamp()}@tech.co.th`;
