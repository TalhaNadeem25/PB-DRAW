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

// Optional: set from app so 401 uses React Router instead of full page redirect (preserves state)
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (onUnauthorized) onUnauthorized();
      else window.location.href = '/login';
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

  verifyEmail: async (token: string) => {
    const response = await api.post(`/auth/verify-email/${token}`);
    return response;
  },

  resendVerificationEmail: async () => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },
};

// Public stats (homepage social proof)
export const statsAPI = {
  getPublic: async () => {
    const response = await api.get('/stats/public');
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
    sort?: 'soonest' | 'popular';
    location?: string;
    skillLevel?: string;
    entryFeeMax?: string;
    format?: string;
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

  completeTournament: async (id: string) => {
    const response = await api.put(`/tournaments/${id}/complete`);
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

// Picklix AI (standalone planner chat — no tournament context required)
export const picklixAIAPI = {
  chat: async (message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>) => {
    const response = await api.post('/ai/chat', { message, history });
    return response;
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

// Waitlist (organizer: get event waitlist, approve entry; player: my position, join, leave)
export const waitlistAPI = {
  getEventWaitlist: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/waitlist/all`);
    return response.data;
  },
  approveEntry: async (eventId: string, waitlistId: string) => {
    const response = await api.post(`/events/${eventId}/waitlist/${waitlistId}/approve`);
    return response.data;
  },
  /** Get current user's waitlist position for an event. Returns null if not on waitlist or endpoint missing. */
  getMyPosition: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/waitlist/my-position`);
    return response.data;
  },
  join: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/waitlist`);
    return response.data;
  },
  leave: async (eventId: string) => {
    const response = await api.delete(`/events/${eventId}/waitlist`);
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

  completePoolPlay: async (eventId: string, poolId: string) => {
    const response = await api.post(`/events/${eventId}/pools/${poolId}/complete-pool-play`);
    return response.data;
  },

  regenerateMatches: async (poolId: string) => {
    const response = await api.post(`/pools/${poolId}/regenerate-matches`);
    return response.data;
  },

  autoAssign: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/pools/auto-assign`);
    return response.data;
  },

  moveMember: async (eventId: string, data: { memberId: string; toPoolId: string }) => {
    const response = await api.post(`/events/${eventId}/pools/move-member`, data);
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
    team1Score?: number;
    team2Score?: number;
    games?: { team1Score: number; team2Score: number }[];
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
  /** Event-level playoffs (all pools: gold/silver/bronze tiers) */
  getEvent: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/playoffs`);
    return response.data;
  },

  generateEvent: async (
    eventId: string,
    body: {
      advanceCountPerPool?: number;
      matchFormats?: { qualifiers?: string; semifinals?: string; finals?: string; bronze?: string };
    }
  ) => {
    const response = await api.post(`/events/${eventId}/playoffs/generate`, body);
    return response.data;
  },

  completeEvent: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/playoffs/complete`);
    return response.data;
  },

  /** Per-pool playoffs (legacy) */
  generate: async (
    eventId: string,
    poolId: string,
    advanceCount?: number,
    matchFormats?: { semifinals?: string; finals?: string; bronze?: string }
  ) => {
    const response = await api.post(`/events/${eventId}/playoffs/${poolId}/generate`, {
      advanceCount: advanceCount ?? 3,
      matchFormats: matchFormats ?? undefined,
    });
    return response.data;
  },

  get: async (eventId: string, poolId: string) => {
    const response = await api.get(`/events/${eventId}/playoffs/${poolId}`);
    return response.data;
  },

  complete: async (eventId: string, poolId: string) => {
    const response = await api.post(`/events/${eventId}/playoffs/${poolId}/complete`);
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

  organizerRefund: async (paymentId: string, data: { refundAmount?: number; reason: string; removeFromEvent?: boolean }) => {
    const response = await api.post(`/cancellations/organizer-refund/${paymentId}`, data);
    return response.data;
  },

  bulkRefundTournament: async (tournamentId: string, reason: string) => {
    const response = await api.post(`/cancellations/tournaments/${tournamentId}/bulk-refund`, { reason });
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

// Communications API
export const communicationAPI = {
  send: async (tournamentId: string, data: {
    subject: string;
    message: string;
    recipientType: string;
    recipientEventId?: string;
    template?: string;
  }) => {
    const response = await api.post(`/communications/${tournamentId}/send`, data);
    return response.data;
  },

  preview: async (tournamentId: string, data: {
    recipientType: string;
    recipientEventId?: string;
  }) => {
    const response = await api.post(`/communications/${tournamentId}/preview`, data);
    return response.data;
  },

  getHistory: async (tournamentId: string, page = 1, limit = 20) => {
    const response = await api.get(`/communications/${tournamentId}/history`, {
      params: { page, limit }
    });
    return response.data;
  },

  getTemplates: async () => {
    const response = await api.get('/communications/templates');
    return response.data;
  },
};

// Court Management API
export const courtAPI = {
  getConfiguration: async (tournamentId: string) => {
    const response = await api.get(`/court-management/${tournamentId}/courts`);
    return response.data;
  },

  updateConfiguration: async (tournamentId: string, data: {
    courts: any[];
    scheduling: any;
  }) => {
    const response = await api.put(`/court-management/${tournamentId}/courts`, data);
    return response.data;
  },

  getScheduleGrid: async (tournamentId: string) => {
    const response = await api.get(`/court-management/${tournamentId}/schedule-grid`);
    return response.data;
  },

  assignMatch: async (matchId: string, data: {
    courtNumber: number;
    scheduledTime: string;
    courtName?: string;
  }) => {
    const response = await api.put(`/matches/${matchId}/assign-court`, data);
    return response.data;
  },

  autoSchedule: async (tournamentId: string, strategy = 'balanced') => {
    const response = await api.post(`/court-management/${tournamentId}/auto-schedule`, { strategy });
    return response.data;
  },

  checkConflicts: async (tournamentId: string) => {
    const response = await api.post(`/court-management/${tournamentId}/check-conflicts`);
    return response.data;
  },

  clearSchedule: async (tournamentId: string) => {
    const response = await api.delete(`/court-management/${tournamentId}/clear-schedule`);
    return response.data;
  },
};

// Test Data
export const testDataAPI = {
  generate: async (tournamentId: string, data: { eventId: string; count: number }) => {
    const response = await api.post(`/tournaments/${tournamentId}/test-data`, data);
    return response.data;
  },

  clear: async (tournamentId: string) => {
    const response = await api.delete(`/tournaments/${tournamentId}/test-data`);
    return response.data;
  },
};

export default api;
