import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Determine API URL based on platform
const getApiUrl = () => {
  // For native mobile apps, use the computer's IP address
  if (Capacitor.isNativePlatform()) {
    // Replace with your computer's IP when developing
    return 'http://192.168.1.141:5000/api';
  }
  // For web, use the environment variable or localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const authAPI = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    skillLevel?: number;
    phone?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    skillLevel?: number;
    avatar?: string;
    bio?: string;
    location?: {
      city?: string;
      state?: string;
    };
    preferences?: {
      playingDays?: string[];
      partnerPreference?: string;
    };
  }) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/auth/stats');
    return response.data;
  },
};

// Tournaments
export const tournamentAPI = {
  getAll: async (params?: {
    status?: string;
    search?: string;
    limit?: number;
    page?: number;
    organizer?: string;
  }) => {
    const response = await api.get('/tournaments', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/tournaments/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/tournaments', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/tournaments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tournaments/${id}`);
    return response.data;
  },

  register: async (id: string) => {
    const response = await api.post(`/tournaments/${id}/register`);
    return response.data;
  },

  uploadImage: async (id: string, imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await api.post(`/tournaments/${id}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  startTournament: async (id: string) => {
    const response = await api.put(`/tournaments/${id}/start`);
    return response.data;
  },

  getRegistrations: async (id: string) => {
    const response = await api.get(`/tournaments/${id}/registrations`);
    return response.data;
  },
};

// AI Planner
export const aiPlannerAPI = {
  chat: async (tournamentId: string, prompt: string, context?: any) => {
    const response = await api.post(`/ai-planner/${tournamentId}/chat`, { prompt, context });
    return response.data;
  },

  applySuggestions: async (tournamentId: string, action: string, data: any) => {
    const response = await api.post(`/ai-planner/${tournamentId}/apply`, { action, data });
    return response.data;
  },
};

// Events
export const eventAPI = {
  getByTournament: async (tournamentId: string) => {
    const response = await api.get(`/tournaments/${tournamentId}/events`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (tournamentId: string, data: any) => {
    const response = await api.post(`/tournaments/${tournamentId}/events`, data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  assignPlayerToPool: async (eventId: string, playerId: string, poolId: string) => {
    const response = await api.put(`/events/${eventId}/assign-player/${playerId}`, { poolId });
    return response.data;
  },

  removePlayerFromPool: async (eventId: string, playerId: string) => {
    const response = await api.put(`/events/${eventId}/remove-player/${playerId}`);
    return response.data;
  },

  movePlayerToEvent: async (eventId: string, playerId: string, targetEventId: string) => {
    const response = await api.put(`/events/${eventId}/move-player/${playerId}`, { targetEventId });
    return response.data;
  },
};

// Teams
export const teamAPI = {
  getByEvent: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/teams`);
    return response.data;
  },

  getMyTeams: async () => {
    const response = await api.get('/teams', { params: { userId: 'me' } });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  create: async (eventId: string, data: any) => {
    const response = await api.post(`/events/${eventId}/teams`, data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },

  removeFromPool: async (id: string) => {
    const response = await api.put(`/teams/${id}`, { pool: null });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  moveToEvent: async (teamId: string, targetEventId: string) => {
    const response = await api.put(`/teams/${teamId}/move-event`, { targetEventId });
    return response.data;
  },
};

// Pools
export const poolAPI = {
  getByEvent: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/pools`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/pools/${id}`);
    return response.data;
  },

  create: async (eventId: string, data: any) => {
    const response = await api.post(`/events/${eventId}/pools`, data);
    return response.data;
  },

  addTeams: async (poolId: string, teamIds: string[]) => {
    const response = await api.post(`/pools/${poolId}/teams`, { teamIds });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/pools/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/pools/${id}`);
    return response.data;
  },

  generateSinglesMatches: async (poolId: string) => {
    const response = await api.post(`/pools/${poolId}/generate-singles-matches`);
    return response.data;
  },
};

// Matches
export const matchAPI = {
  getByPool: async (poolId: string) => {
    const response = await api.get(`/pools/${poolId}/matches`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  },

  updateScore: async (id: string, data: {
    team1Score: number;
    team2Score: number;
    status?: string;
  }) => {
    const response = await api.put(`/matches/${id}/score`, data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/matches/${id}`, data);
    return response.data;
  },

  checkIn: async (matchId: string) => {
    const response = await api.post(`/matches/${matchId}/check-in`);
    return response.data;
  },

  markNoShow: async (matchId: string, teamNumber: number) => {
    const response = await api.post(`/matches/${matchId}/no-show`, { teamNumber });
    return response.data;
  },
};

// Playoffs
export const playoffAPI = {
  generate: async (eventId: string, poolId: string) => {
    const response = await api.post(`/events/${eventId}/playoffs/${poolId}/generate`);
    return response.data;
  },

  get: async (eventId: string, poolId: string) => {
    const response = await api.get(`/events/${eventId}/playoffs/${poolId}`);
    return response.data;
  },
};

// User-specific endpoints
export const userAPI = {
  // Get tournaments created by user (organizer)
  getMyTournaments: async () => {
    const response = await api.get('/tournaments', { params: { organizer: 'me' } });
    return response.data;
  },

  // Get tournaments user is registered for
  getMyRegistrations: async () => {
    const response = await api.get('/tournaments', { params: { registered: 'me' } });
    return response.data;
  },

  // Get tournament history (completed tournaments)
  getMyHistory: async () => {
    const response = await api.get('/tournaments', { params: { status: 'completed', participant: 'me' } });
    return response.data;
  },
};

// Invitations
export const invitationAPI = {
  send: async (teamId: string, data: { inviteeEmail: string; inviteeName?: string; message?: string; sendEmail?: boolean }) => {
    const response = await api.post(`/teams/${teamId}/invitations`, data);
    return response.data;
  },

  getReceived: async () => {
    const response = await api.get('/invitations', { params: { type: 'received' } });
    return response.data;
  },

  getSent: async () => {
    const response = await api.get('/invitations', { params: { type: 'sent' } });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/invitations/${id}`);
    return response.data;
  },

  accept: async (id: string) => {
    const response = await api.put(`/invitations/${id}/accept`);
    return response.data;
  },

  decline: async (id: string) => {
    const response = await api.put(`/invitations/${id}/decline`);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.delete(`/invitations/${id}`);
    return response.data;
  },
};

// Payments
export const paymentAPI = {
  createIntent: async (data: { teamId: string; eventId: string }) => {
    const response = await api.post('/payments/create-intent', data);
    return response.data;
  },

  createMultiEventIntent: async (data: {
    eventRegistrations: { eventId: string; teamId: string }[]
  }) => {
    const response = await api.post('/payments/create-multi-event-intent', data);
    return response.data;
  },

  createPartnerPaymentIntent: async (data: { invitationId: string }) => {
    const response = await api.post('/payments/create-partner-intent', data);
    return response.data;
  },

  confirmPayment: async (paymentIntentId: string) => {
    const response = await api.post('/payments/confirm', { paymentIntentId });
    return response.data;
  },

  getPayment: async (id: string) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  getMyPayments: async () => {
    const response = await api.get('/payments/my-payments');
    return response.data;
  },

  refundPayment: async (id: string, reason?: string) => {
    const response = await api.post(`/payments/${id}/refund`, { reason });
    return response.data;
  },
};

// Analytics
export const analyticsAPI = {
  getOrganizationAnalytics: async (userId: string, params?: {
    startDate?: string;
    endDate?: string;
    tournamentId?: string;
  }) => {
    const response = await api.get(`/analytics/organization/${userId}`, { params });
    return response.data;
  },

  exportCSV: async (userId: string, params?: {
    startDate?: string;
    endDate?: string;
    tournamentId?: string;
  }) => {
    const response = await api.get(`/analytics/organization/${userId}/export/csv`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  exportPDF: async (userId: string, params?: {
    startDate?: string;
    endDate?: string;
    tournamentId?: string;
  }) => {
    const response = await api.get(`/analytics/organization/${userId}/export/pdf`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// Cancellations
export const cancellationAPI = {
  requestCancellation: async (eventId: string, reason?: string) => {
    const response = await api.post(`/cancellations/events/${eventId}/cancel`, { reason });
    return response.data;
  },

  getRefundPreview: async (eventId: string) => {
    const response = await api.get(`/cancellations/events/${eventId}/refund-preview`);
    return response.data;
  },

  getMyCancellations: async () => {
    const response = await api.get('/cancellations/my-cancellations');
    return response.data;
  },

  respondToPartnerCancellation: async (cancellationId: string, decision: 'refund' | 'find-partner') => {
    const response = await api.post(`/cancellations/${cancellationId}/partner-response`, { decision });
    return response.data;
  },

  getTournamentCancellations: async (tournamentId: string) => {
    const response = await api.get(`/cancellations/tournaments/${tournamentId}`);
    return response.data;
  },
};

// Partner Matching
export const partnerAPI = {
  getAvailablePlayers: async (params?: {
    skillMin?: number;
    skillMax?: number;
    city?: string;
    state?: string;
    playingDays?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/partners/players', { params });
    return response.data;
  },

  sendRequest: async (data: { receiverId: string; eventId?: string; tournamentId?: string; message?: string }) => {
    const response = await api.post('/partners/requests', data);
    return response.data;
  },

  getReceivedRequests: async () => {
    const response = await api.get('/partners/requests/received');
    return response.data;
  },

  getSentRequests: async () => {
    const response = await api.get('/partners/requests/sent');
    return response.data;
  },

  respondToRequest: async (requestId: string, action: 'accept' | 'decline') => {
    const response = await api.put(`/partners/requests/${requestId}/respond`, { action });
    return response.data;
  },

  cancelRequest: async (requestId: string) => {
    const response = await api.delete(`/partners/requests/${requestId}`);
    return response.data;
  },

  updatePreference: async (partnerPreference: 'looking' | 'have-partner' | 'either') => {
    const response = await api.put('/partners/preference', { partnerPreference });
    return response.data;
  },
};

// Favorites (using localStorage for now, can be moved to backend later)
export const favoritesAPI = {
  getFavorites: (): string[] => {
    const favorites = localStorage.getItem('tournament_favorites');
    return favorites ? JSON.parse(favorites) : [];
  },

  addFavorite: (tournamentId: string): void => {
    const favorites = favoritesAPI.getFavorites();
    if (!favorites.includes(tournamentId)) {
      favorites.push(tournamentId);
      localStorage.setItem('tournament_favorites', JSON.stringify(favorites));
    }
  },

  removeFavorite: (tournamentId: string): void => {
    const favorites = favoritesAPI.getFavorites();
    const filtered = favorites.filter(id => id !== tournamentId);
    localStorage.setItem('tournament_favorites', JSON.stringify(filtered));
  },

  isFavorite: (tournamentId: string): boolean => {
    const favorites = favoritesAPI.getFavorites();
    return favorites.includes(tournamentId);
  },
};

export default api;
