let cachedRole: string | null = null;

export function getCachedRole(): string | null {
    return cachedRole;
}

export function setCachedRole(role: string | null) {
    cachedRole = role;
}
