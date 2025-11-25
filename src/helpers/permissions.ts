export function isForbiddenError(error: unknown): boolean {
    if (!error) return false;
    if (error instanceof Error) {
        return error.name === "ForbiddenError";
    }
    if (typeof error === "object" && "name" in (error as Record<string, unknown>)) {
        return (error as Record<string, unknown>).name === "ForbiddenError";
    }
    return false;
}


