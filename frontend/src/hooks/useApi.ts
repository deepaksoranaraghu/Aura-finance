import { useQuery } from '@tanstack/react-query';

export const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:4000');

const fetcher = async (url: string) => {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error('Network error');
  return res.json();
};

export const useSummary = (month?: string, year?: string) => {
  const query = month ? `?month=${month}` : year ? `?year=${year}` : '';
  return useQuery({
    queryKey: ['summary', month, year],
    queryFn: () => fetcher(`/api/summary${query}`)
  });
};

export const useTransactions = (month?: string, year?: string) => {
  const query = month ? `?month=${month}` : year ? `?year=${year}` : '';
  return useQuery({
    queryKey: ['transactions', month, year],
    queryFn: () => fetcher(`/api/transactions${query}`)
  });
};

export const useAnalytics = (month?: string, year?: string) => {
  const query = month ? `?month=${month}` : year ? `?year=${year}` : '';
  return useQuery({
    queryKey: ['analytics', month, year],
    queryFn: () => fetcher(`/api/analytics${query}`)
  });
};

export const useGoals = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => fetcher('/api/goals')
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetcher('/api/categories')
  });
};

export const useBudgets = (month?: string, year?: string) => {
  const query = month ? `?month=${month}` : year ? `?year=${year}` : '';
  return useQuery({
    queryKey: ['budgets', month, year],
    queryFn: () => fetcher(`/api/budgets${query}`)
  });
};

export const useSubscriptions = () => {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => fetcher('/api/subscriptions')
  });
};

export const useInsights = (month?: string, year?: string) => {
  const query = month ? `?month=${month}` : year ? `?year=${year}` : '';
  return useQuery({
    queryKey: ['insights', month, year],
    queryFn: () => fetcher(`/api/insights${query}`)
  });
};

export const saveApiKey = async (apiKey: string) => {
  const res = await fetch(`${API_BASE}/api/settings/apikey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  if (!res.ok) throw new Error('Failed to save API key');
  return res.json();
};

export const syncBank = async () => {
  const res = await fetch(`${API_BASE}/api/sync`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to sync with Bank');
  }
  return res.json();
};
