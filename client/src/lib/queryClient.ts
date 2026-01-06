import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;

  if (user) {
    return {
      "x-firebase-uid": user.uid,
    };
  }

  // Check for guest session
  const guestUid = localStorage.getItem("guest_uid");

  if (guestUid) {
    return {
      "x-firebase-uid": guestUid,
    };
  }

  return {};
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  headers?: HeadersInit,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const authHeaders = await getAuthHeaders();

      const res = await fetch(queryKey.join("/") as string, {
        headers: authHeaders,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes global stale time
      gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours (for persistence)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Create IDB Persister for offline storage
export const persister = {
  persistClient: async (client: QueryClient) => {
    // We can't use sync storage for IDB, so we implement a custom async persister structure
    // But @tanstack/react-query-persist-client handles the async nature.
    // However, createSyncStoragePersister is for localStorage/sessionStorage. 
    // For IDB, we create a simple object adhering to Persister interface.
    // wait, for simplicity let's use a wrapper.
  },
  restoreClient: async () => {
    // ...
  }
} as any;

// Simple custom persister using idb-keyval
export const idbPersister = {
  persistClient: async (client: any) => {
    await set('reactQueryClient', client);
  },
  restoreClient: async () => {
    return await get('reactQueryClient');
  },
  removeClient: async () => {
    await del('reactQueryClient');
  },
} as any;

// Using a simpler approach recommended for v5:
export const persisterOptions = {
  persister: {
    persistClient: async (client: any) => {
      await set('REACT_QUERY_OFFLINE_CACHE', client);
    },
    restoreClient: async () => {
      return await get('REACT_QUERY_OFFLINE_CACHE');
    },
    removeClient: async () => {
      await del('REACT_QUERY_OFFLINE_CACHE');
    },
  },
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
};
