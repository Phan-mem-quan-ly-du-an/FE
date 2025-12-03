export function isForbiddenError(error: unknown): boolean {
    if (!error) return false;
    
    // Check for HTTP 403 Forbidden status
    if (typeof error === "object" && "response" in (error as Record<string, unknown>)) {
        const response = (error as Record<string, unknown>).response;
        if (typeof response === "object" && response !== null && "status" in response) {
            if ((response as Record<string, unknown>).status === 403) {
                return true;
            }
        }
    }
    
    // Check for ForbiddenError name
    if (error instanceof Error) {
        return error.name === "ForbiddenError";
    }
    if (typeof error === "object" && "name" in (error as Record<string, unknown>)) {
        return (error as Record<string, unknown>).name === "ForbiddenError";
    }
    
    return false;
}


