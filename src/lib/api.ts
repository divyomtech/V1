/**
 * API Client for He&She PG Backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token management
const TOKEN_KEY = 'heandshepg_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

// API request helper
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
}

// Types
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        is_active: boolean;
        is_verified: boolean;
    };
    profile: {
        id: string;
        user_id: string;
        name: string;
        phone?: string;
        email?: string;
        profile_photo?: string;
    } | null;
    role: 'customer' | 'owner' | 'admin' | null;
    token: {
        access_token: string;
    };
}

export interface Property {
    id: string;
    owner_id: string;
    title: string;
    description?: string;
    address: string;
    city: string;
    locality?: string;
    latitude?: number;
    longitude?: number;
    gender_preference: 'male' | 'female' | 'mixed';
    amenities?: string[];
    monthly_rent: number;
    deposit: number;
    rules?: string;
    photos?: string[];
    status: string;
    available_from?: string;
    instant_booking?: boolean;
    virtual_tour_url?: string;
    safety_score?: number;
    created_at: string;
}

export interface PropertyDetail extends Property {
    rooms: Room[];
    owner_profile: {
        name: string;
        phone?: string;
        profile_photo?: string;
    };
    average_rating?: number;
    review_count: number;
}

export interface Room {
    id: string;
    property_id: string;
    room_type: string;
    bed_count: number;
    price: number;
    is_available: boolean;
}

export interface Favorite {
    id: string;
    user_id: string;
    property_id: string;
    created_at: string;
    property?: Property;
}

// Auth API
export const api = {
    // Auth
    async signup(email: string, password: string, name: string, role: string): Promise<AuthResponse> {
        return request<AuthResponse>('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, role }),
        });
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        return request<AuthResponse>('/api/auth/login/json', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    async getCurrentUser(): Promise<AuthResponse> {
        return request<AuthResponse>('/api/auth/me');
    },

    async resetPassword(email: string): Promise<{ message: string }> {
        return request('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    // Properties
    async getProperties(filters?: {
        city?: string;
        gender_preference?: string;
        min_rent?: number;
        max_rent?: number;
        amenities?: string;
        sort_by?: string;
    }): Promise<Property[]> {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    params.append(key, String(value));
                }
            });
        }
        const query = params.toString();
        return request<Property[]>(`/api/properties${query ? `?${query}` : ''}`);
    },

    async getProperty(id: string): Promise<PropertyDetail> {
        return request<PropertyDetail>(`/api/properties/${id}`);
    },

    async createProperty(data: Partial<Property>): Promise<Property> {
        return request<Property>('/api/properties', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateProperty(id: string, data: Partial<Property>): Promise<Property> {
        return request<Property>(`/api/properties/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Favorites
    async getFavorites(): Promise<Favorite[]> {
        return request<Favorite[]>('/api/favorites');
    },

    async addFavorite(propertyId: string): Promise<Favorite> {
        return request<Favorite>('/api/favorites', {
            method: 'POST',
            body: JSON.stringify({ property_id: propertyId }),
        });
    },

    async removeFavorite(propertyId: string): Promise<void> {
        return request(`/api/favorites/${propertyId}`, {
            method: 'DELETE',
        });
    },

    // Bookings
    async getBookings(): Promise<any[]> {
        return request('/api/bookings');
    },

    async getAllBookings(status?: string): Promise<any[]> {
        const query = status ? `?status_filter=${status}` : '';
        return request(`/api/bookings/all${query}`);
    },

    async createBooking(data: {
        property_id: string;
        room_id?: string;
        start_date: string;
        end_date?: string;
    }): Promise<any> {
        return request('/api/bookings', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateBookingStatus(bookingId: string, status: 'accepted' | 'cancelled' | 'paid' | 'checked-in' | 'completed'): Promise<any> {
        return request(`/api/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    async cancelBooking(bookingId: string, cancelReason?: string): Promise<any> {
        return request(`/api/bookings/${bookingId}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ cancel_reason: cancelReason }),
        });
    },

    // Reviews
    async getPropertyReviews(propertyId: string): Promise<any[]> {
        return request(`/api/reviews/property/${propertyId}`);
    },

    async createReview(data: {
        property_id: string;
        rating: number;
        comment?: string;
    }): Promise<any> {
        return request('/api/reviews', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Messages
    async getConversations(): Promise<any[]> {
        return request('/api/messages/conversations');
    },

    async getMessages(conversationId: string): Promise<any[]> {
        return request(`/api/messages/conversation/${conversationId}`);
    },

    async sendMessage(data: {
        to_user: string;
        property_id: string;
        content: string;
    }): Promise<any> {
        return request('/api/messages', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // User Profile
    async getProfile(): Promise<any> {
        return request('/api/users/profile');
    },

    async updateProfile(data: any): Promise<any> {
        return request('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // ========== Admin APIs ==========

    // Audit Logs
    async getAuditLogs(params?: { action?: string; entity_type?: string; limit?: number }): Promise<any[]> {
        const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
        return request(`/api/admin/audit-logs${queryString}`);
    },

    // KYC / Owner Applications
    async getOwnerApplications(status?: string): Promise<any[]> {
        const query = status ? `?status_filter=${status}` : '';
        return request(`/api/admin/owner-applications${query}`);
    },

    async approveOwnerApplication(applicationId: string, adminNotes?: string): Promise<any> {
        return request(`/api/admin/owner-applications/${applicationId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ admin_notes: adminNotes }),
        });
    },

    async rejectOwnerApplication(applicationId: string, adminNotes?: string): Promise<any> {
        return request(`/api/admin/owner-applications/${applicationId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ admin_notes: adminNotes }),
        });
    },

    // User Management
    async getAllUsers(role?: string): Promise<any[]> {
        const query = role ? `?role_filter=${role}` : '';
        return request(`/api/admin/users${query}`);
    },

    async updateUserRole(userId: string, role: string): Promise<any> {
        return request(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        });
    },

    // Audit Logs
    async getAuditLogs(limit: number = 50): Promise<any[]> {
        return request(`/api/admin/audit-logs?limit=${limit}`);
    },

    // System Settings
    async getSystemSettings(): Promise<any[]> {
        return request('/api/admin/settings');
    },

    async updateSystemSetting(key: string, value: string): Promise<any> {
        return request(`/api/admin/settings/${key}`, {
            method: 'PUT',
            body: JSON.stringify({ value }),
        });
    },

    // Admin Stats
    async getAdminStats(): Promise<{
        total_users: number;
        total_properties: number;
        total_bookings: number;
        pending_kyc_applications: number;
    }> {
        return request('/api/admin/stats');
    },

    // ========== Owner APIs ==========

    // Financial Tracking
    async getOwnerPayments(status?: string): Promise<any[]> {
        const query = status ? `?status_filter=${status}` : '';
        return request(`/api/owner/payments${query}`);
    },

    async getOwnerInvoices(status?: string): Promise<any[]> {
        const query = status ? `?status_filter=${status}` : '';
        return request(`/api/owner/invoices${query}`);
    },

    async getOwnerFinancialSummary(): Promise<{
        total_revenue: number;
        pending_payments: number;
        total_properties: number;
        total_tenants: number;
        monthly_revenue: number;
    }> {
        return request('/api/owner/financial-summary');
    },

    // Tenant Management
    async getOwnerTenants(propertyId?: string): Promise<any[]> {
        const query = propertyId ? `?property_id=${propertyId}` : '';
        return request(`/api/owner/tenants${query}`);
    },

    // ========== Roommate Matching APIs ==========

    async getRoommateProfile(): Promise<any> {
        return request('/api/roommates/profile');
    },

    async createOrUpdateRoommateProfile(data: {
        age?: number;
        gender?: string;
        occupation?: string;
        budget_min?: number;
        budget_max?: number;
        preferred_location?: string;
        preferred_city?: string;
        move_in_date?: string;
        preferences?: string[];
        languages?: string[];
        hobbies?: string[];
        bio?: string;
    }): Promise<any> {
        return request('/api/roommates/profile', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async deleteRoommateProfile(): Promise<any> {
        return request('/api/roommates/profile', { method: 'DELETE' });
    },

    async getRoommateMatches(): Promise<any[]> {
        return request('/api/roommates/matches');
    },

    async connectWithRoommate(profileId: string): Promise<any> {
        return request(`/api/roommates/matches/${profileId}/connect`, {
            method: 'POST',
        });
    },

    // ========== Referral Program APIs ==========

    async getReferralCode(): Promise<{
        id: string;
        code: string;
        is_active: boolean;
        total_referrals: number;
        total_rewards: number;
        created_at: string;
    }> {
        return request('/api/referrals/code');
    },

    async getReferralStats(): Promise<{
        total_referrals: number;
        successful_referrals: number;
        pending_referrals: number;
        total_rewards_earned: number;
        unclaimed_rewards: number;
        referral_code: string | null;
    }> {
        return request('/api/referrals/stats');
    },

    async getMyReferrals(): Promise<any[]> {
        return request('/api/referrals/list');
    },

    async applyReferralCode(code: string): Promise<any> {
        return request('/api/referrals/apply', {
            method: 'POST',
            body: JSON.stringify({ referral_code: code }),
        });
    },

    async claimReferralRewards(): Promise<any> {
        return request('/api/referrals/claim', { method: 'POST' });
    },

    // ========== Property Moderation (Admin) ==========

    async getPropertiesForModeration(status?: string): Promise<any[]> {
        const query = status ? `?status_filter=${status}` : '';
        return request(`/api/admin/properties${query}`);
    },

    async moderateProperty(propertyId: string, status: string, reason?: string): Promise<any> {
        return request(`/api/admin/properties/${propertyId}/moderate`, {
            method: 'PUT',
            body: JSON.stringify({ status, reason }),
        });
    },

    async adminDeleteProperty(propertyId: string): Promise<any> {
        return request(`/api/admin/properties/${propertyId}`, { method: 'DELETE' });
    },

    // ========== Payment APIs ==========

    async createPaymentOrder(bookingId: string, amount: number): Promise<{
        order_id: string;
        amount: number;
        currency: string;
        key_id: string;
        booking_id: string;
        user_email: string;
        user_name: string;
    }> {
        return request('/api/payments/create-order', {
            method: 'POST',
            body: JSON.stringify({ booking_id: bookingId, amount }),
        });
    },

    async verifyPayment(data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        booking_id: string;
    }): Promise<any> {
        return request('/api/payments/verify', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getPaymentHistory(): Promise<any[]> {
        return request('/api/payments/history');
    },
};

export default api;



