import { QueryFunction } from "@tanstack/react-query";

/**
 * Creates a query function that includes repositoryId as a query parameter
 */
export function createRepoQueryFn<T>(
  baseUrl: string,
  repositoryId: string | null
): QueryFunction<T> {
  return async () => {
    const url = repositoryId 
      ? `${baseUrl}?repositoryId=${repositoryId}`
      : baseUrl;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch from ${baseUrl}`);
    }
    return res.json();
  };
}

