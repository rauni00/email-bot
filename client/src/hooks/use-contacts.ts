import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertContact } from "@shared/schema";

// GET /api/contacts
export function useContacts(filters?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [api.contacts.list.path, filters],
    queryFn: async () => {
      let url = api.contacts.list.path;
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json() as Promise<{ contacts: any[], total: number, pages: number }>;
    },
  });
}

// PATCH /api/contacts/:id/status
export function useUpdateContactStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/contacts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contacts.stats.path] });
    },
  });
}

// POST /api/contacts (Manual Entry)
export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertContact) => {
      const validated = api.contacts.create.input.parse(data);
      const res = await fetch(api.contacts.create.path, {
        method: api.contacts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create contact");
      }
      return api.contacts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contacts.stats.path] });
    },
  });
}

// POST /api/contacts/upload (PDF)
export function useUploadContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.contacts.upload.path, {
        method: api.contacts.upload.method,
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to upload contacts");
      }
      return api.contacts.upload.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contacts.stats.path] });
    },
  });
}

// GET /api/contacts/stats
export function useContactStats() {
  return useQuery({
    queryKey: [api.contacts.stats.path],
    queryFn: async () => {
      const res = await fetch(api.contacts.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.contacts.stats.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll every 5s for stats updates while engine runs
  });
}
