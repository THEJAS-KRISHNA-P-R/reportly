// Centralized API client for type-safe API calls


interface ApiError {
  message: string;
  status: number;
  code?: string;
}

function isApiEnvelope(value: unknown): value is { ok: boolean; data?: unknown; error?: { message?: string; code?: string } } {
  return !!value && typeof value === 'object' && 'ok' in (value as Record<string, unknown>);
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_API_URL || ''}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const payload = await response.json();

    if (isApiEnvelope(payload)) {
      if (!payload.ok) {
        throw {
          message: payload.error?.message || 'An error occurred',
          status: response.status,
          code: payload.error?.code,
        } as ApiError;
      }

      return payload.data as T;
    }

    if (!response.ok) {
      throw {
        message: (payload as any)?.message || (payload as any)?.error || 'An error occurred',
        status: response.status,
      } as ApiError;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof Error) {
      throw {
        message: error.message,
        status: 500,
      } as ApiError;
    }
    throw error;
  }
}

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string) =>
    apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  logout: () =>
    apiCall('/api/auth/logout', {
      method: 'POST',
    }),
};

// Client endpoints
export const clientsApi = {
  list: () => apiCall('/api/clients'),

  get: (id: string) => apiCall(`/api/clients/${id}`),

  create: (name: string, website?: string, ga4PropertyId?: string) =>
    apiCall('/api/clients', {
      method: 'POST',
      body: JSON.stringify({
        name,
        website,
        ga4_property_id: ga4PropertyId,
      }),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiCall(`/api/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/api/clients/${id}`, {
      method: 'DELETE',
    }),
};

// Report endpoints
export const reportsApi = {
  list: (clientId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (clientId) params.append('client_id', clientId);
    if (status) params.append('status', status);
    return apiCall(`/api/reports?${params.toString()}`);
  },

  get: (id: string) => apiCall(`/api/reports/${id}`),

  generate: (clientId: string, startDate: string, endDate: string) =>
    apiCall('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        start_date: startDate,
        end_date: endDate,
      }),
    }),

  update: (id: string, status: string, narrative?: string) =>
    apiCall(`/api/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        narrative,
      }),
    }),

  delete: (id: string) =>
    apiCall(`/api/reports/${id}`, {
      method: 'DELETE',
    }),

  exportPdf: (id: string) => apiCall(`/api/reports/${id}/pdf`),

  send: (id: string, recipientEmail: string, subject?: string, message?: string) =>
    apiCall(`/api/reports/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({
        recipient_email: recipientEmail,
        subject,
        message,
      }),
    }),
};

// Settings endpoints
export const settingsApi = {
  get: () => apiCall('/api/settings'),

  update: (data: Record<string, unknown>) =>
    apiCall('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Audit endpoints
export const auditApi = {
  list: (limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return apiCall(`/api/audit?${params.toString()}`);
  },
};

// Admin endpoints
export const adminApi = {
  getDlqJobs: () => apiCall('/api/admin/dlq'),

  retryDlqJob: (jobId: string) =>
    apiCall('/api/admin/dlq', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId }),
    }),
};
