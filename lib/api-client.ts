import type {
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ResendOTPRequest,
  ResendOTPResponse,
  RegisterRequest,
  AuthResponse,
  LoginRequest,
  AdminLoginRequest,
  User,
  UpdateProfileRequest,
  APIError,
  BookingCreate,
  Booking,
  PaymentVerification,
  RazorpayOrder,
  ReviewCreate,
  Review,
  VehicleRating,
  ReviewEligibility,
  Permission,
  PermissionCreate,
  PermissionUpdate,
  SubAdminCreate,
  SubAdminUpdate,
  OwnerKYCPayload,
  AdminOwnerKYCCreate,
  AdminOwnerKYCUpdate,
  OwnerKYCWithAudit,
  AuditLogEntry,
  EligibleUser,
  AdminKYCVerifyRequest,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: APIError = await response.json().catch(() => ({
        detail: "An error occurred",
      }));
      throw new Error(error.detail || "An error occurred");
    }
    return response.json();
  }

  // Token management
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("access_token", token);
  }

  removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
  }

  // Auth endpoints
  async sendOTP(data: SendOTPRequest): Promise<SendOTPResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse<SendOTPResponse>(response);
  }

  async verifyOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse<VerifyOTPResponse>(response);
  }

  async resendOTP(data: ResendOTPRequest): Promise<ResendOTPResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse<ResendOTPResponse>(response);
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const authResponse = await this.handleResponse<AuthResponse>(response);
    if (authResponse.access_token) {
      this.setToken(authResponse.access_token);
    }
    return authResponse;
  }

  async sendLoginOTP(data: LoginRequest): Promise<SendOTPResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/login/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse<SendOTPResponse>(response);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const authResponse = await this.handleResponse<AuthResponse>(response);
    if (authResponse.access_token) {
      this.setToken(authResponse.access_token);
    }
    return authResponse;
  }

  async adminLogin(data: AdminLoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const authResponse = await this.handleResponse<AuthResponse>(response);
    if (authResponse.access_token) {
      this.setToken(authResponse.access_token);
    }
    return authResponse;
  }

  async ownerLogin(data: AdminLoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/auth/owner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const authResponse = await this.handleResponse<AuthResponse>(response);
    if (authResponse.access_token) {
      this.setToken(authResponse.access_token);
    }
    return authResponse;
  }

  // User endpoints
  async getProfile(): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/v1/users/`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<User>(response);
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/v1/users/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<User>(response);
  }

  async uploadProfileImage(userId: string, file: File): Promise<User> {
    const formData = new FormData();
    formData.append("file", file);

    const token = this.getToken();
    const response = await fetch(
      `${this.baseURL}/api/v1/users/profile/${userId}`,
      {
        method: "PATCH",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Don't set Content-Type - browser will set it with boundary for multipart/form-data
        },
        body: formData,
      }
    );
    return this.handleResponse<User>(response);
  }

  // Partner/Owner endpoints
  async becomePartner(): Promise<{
    access_token: string;
    token_type: string;
    message: string;
  }> {
    const response = await fetch(`${this.baseURL}/api/v1/users/become-partner`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<{
      access_token: string;
      token_type: string;
      message: string;
    }>(response);
    // Update token with the new one that has owner role
    if (result.access_token) {
      this.setToken(result.access_token);
    }
    return result;
  }

  async submitOwnerKYC(kycData: OwnerKYCPayload): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/owner-kyc/submit`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(kycData),
    });
    return this.handleResponse(response);
  }

  async getMyKYC(): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/owner-kyc/my-kyc`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateOwnerKYC(kycData: {
    full_name?: string | null;
    mobile_number?: string | null;
    email_id?: string | null;
    company_name?: string | null;
    business_address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    pan_number?: string | null;
    gst_number?: string | null;
    account_number?: string | null;
    bank_name?: string | null;
    ifsc_code?: string | null;
    id?: string;
  }): Promise<any> {
    const kycId = kycData.id;
    if (!kycId) {
      throw new Error("KYC ID is required for update");
    }
    const response = await fetch(`${this.baseURL}/api/v1/owner-kyc/${kycId}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(kycData),
    });
    return this.handleResponse(response);
  }

  async getOwnerAnalytics(): Promise<{
    total_bookings: number;
    total_earnings: number;
    monthly_earnings: number;
    earnings_by_month: Array<{ month: string; earnings: number }>;
    booking_status_distribution: Array<{ name: string; value: number }>;
    vehicle_performance: Array<{ vehicle: string; bookings: number }>;
  }> {
    const response = await fetch(`${this.baseURL}/api/v1/owner/analytics/dashboard`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  // Admin KYC endpoints
  async getAllKYC(skip: number = 0, limit: number = 100): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/kyc/all?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getPendingKYC(skip: number = 0, limit: number = 100): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/kyc/pending?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async verifyKYC(
    kycId: string,
    status: "approved" | "rejected",
    rejectedReason?: string
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/kyc/verify/${kycId}`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          status,
          rejected_reason: rejectedReason,
        }),
      }
    );
    return this.handleResponse(response);
  }

  // Admin endpoints
  async getStatistics(): Promise<{
    total_users: number;
    active_users: number;
    inactive_users: number;
    total_drivers?: number;
    active_drivers?: number;
    total_vehicles?: number;
    active_vehicles?: number;
    total_bookings?: number;
    pending_bookings?: number;
    completed_bookings?: number;
    total_revenue?: number;
    pending_kyc?: number;
  }> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/statistics`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getRevenueAnalytics(): Promise<{
    data: Array<{ month: string; revenue: number; bookings: number }>;
  }> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/analytics/revenue`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getUserGrowthAnalytics(): Promise<{
    data: Array<{ month: string; users: number }>;
  }> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/analytics/user-growth`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getBookingStatusAnalytics(): Promise<{
    data: Array<{ name: string; value: number }>;
  }> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/analytics/booking-status`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getVehicleBookingsAnalytics(): Promise<{
    data: Array<{ type: string; [key: string]: number | string }>;
  }> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/analytics/vehicle-bookings`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAllUsers(skip: number = 0, limit: number = 100, role?: string): Promise<any> {
    let url = `${this.baseURL}/api/v1/admin/users?skip=${skip}&limit=${limit}`;
    if (role) {
      url += `&role=${role}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/users/${userId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async activateUser(userId: string): Promise<User> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/users/${userId}/activate`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async deactivateUser(userId: string): Promise<User> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/users/${userId}/deactivate`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // Vehicle endpoints
  async addVehicle(formData: FormData): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/vehicles/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  async getMyVehicles(skip: number = 0, limit: number = 100): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/vehicles/my-vehicles?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getVehicle(vehicleId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/vehicles/${vehicleId}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateVehicle(vehicleId: string, data: any): Promise<any> {
    // Check if data is FormData
    const isFormData = data instanceof FormData;

    const response = await fetch(`${this.baseURL}/api/v1/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: isFormData
        ? { Authorization: `Bearer ${this.getToken()}` }
        : this.getAuthHeaders(),
      body: isFormData ? data : JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async toggleVehicleStatus(vehicleId: string, isActive: boolean): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/vehicles/${vehicleId}/toggle-status?is_active=${isActive}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateVehicleImages(vehicleId: string, images: File[]): Promise<any> {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("vehicle_images", image);
    });

    const response = await fetch(`${this.baseURL}/api/v1/vehicles/${vehicleId}/images`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  async searchVehicles(data: {
    latitude: number;
    longitude: number;
    radius?: number;
    vehicle_type?: string;
  }): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}/api/v1/vehicles/nearby`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<any>(response);
    // Return the full result with data field for backward compatibility
    return result;
  }

  async getVehicleById(vehicleId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/vehicles/${vehicleId}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<any>(response);
    return result.data || result;
  }

  async updateVehicleLocation(latitude: number, longitude: number): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/vehicles/driver/update-location`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        current_lat: latitude,
        current_long: longitude,
      }),
    });
    const result = await this.handleResponse<any>(response);
    return result.data || result;
  }

  async getDriverVehicle(): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/vehicles/driver/my-vehicle`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    const result = await this.handleResponse<any>(response);
    return result.data || result;
  }

  // Booking endpoints
  async getDriverBookings(status?: string, skip: number = 0, limit: number = 100): Promise<any> {
    let url = `${this.baseURL}/api/v1/bookings/driver/my-bookings?skip=${skip}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async acceptBooking(bookingId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/bookings/${bookingId}/accept`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async rejectBooking(bookingId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/bookings/${bookingId}/reject`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Driver endpoints
  async sendDriverOTP(mobile_number: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/drivers/send-otp`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mobile_number }),
    });
    return this.handleResponse(response);
  }

  async verifyDriverOTP(mobile_number: string, otp_code: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/drivers/verify-otp`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mobile_number, otp_code }),
    });
    return this.handleResponse(response);
  }

  async addDriver(formData: FormData): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/drivers/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  async getMyDrivers(skip: number = 0, limit: number = 100): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/drivers/my-drivers?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateDriver(driverId: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/drivers/${driverId}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deleteDriver(driverId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/drivers/${driverId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async toggleDriverStatus(driverId: string, isActive: boolean): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/drivers/${driverId}/toggle-status?is_active=${isActive}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // Admin Drivers endpoints
  async getAllDrivers(skip: number = 0, limit: number = 100): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/drivers?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getPrimaryOwners(skip: number = 0, limit: number = 500): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/drivers/owners?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async addDriverAdmin(formData: FormData): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/drivers/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  async deleteDriverAdmin(driverId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/drivers/${driverId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async toggleDriverStatusAdmin(driverId: string, isActive: boolean): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/drivers/${driverId}/toggle-status?is_active=${isActive}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateDriverAdmin(driverId: string, data: any): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/drivers/${driverId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async getDriverAuditHistory(
    driverId: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<{ data: AuditLogEntry[]; total: number }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/drivers/${driverId}/audit-history?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // Owner Sub-User endpoints
  async sendSubUserOTP(mobile_number: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/owner-sub-users/send-otp`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mobile_number }),
    });
    return this.handleResponse(response);
  }

  async verifySubUserOTP(mobile_number: string, otp_code: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/owner-sub-users/verify-otp`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mobile_number, otp_code }),
    });
    return this.handleResponse(response);
  }

  async addSubUser(data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/owner-sub-users/add`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getMySubUsers(skip: number = 0, limit: number = 100): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/owner-sub-users/my-sub-users?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateSubUser(subUserId: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/owner-sub-users/${subUserId}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deleteSubUser(subUserId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/owner-sub-users/${subUserId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async toggleSubUserStatus(subUserId: string, isActive: boolean): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/owner-sub-users/${subUserId}/toggle-status?is_active=${isActive}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // Admin Vehicles endpoints
  async getAllVehicles(skip: number = 0, limit: number = 100, approvalStatus?: string): Promise<any> {
    let url = `${this.baseURL}/api/v1/admin/vehicles?skip=${skip}&limit=${limit}`;
    if (approvalStatus) {
      url += `&approval_status=${approvalStatus}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteVehicleAdmin(vehicleId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicles/${vehicleId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async toggleVehicleStatusAdmin(vehicleId: string, isActive: boolean): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicles/${vehicleId}/toggle-status?is_active=${isActive}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateVehicleAdmin(vehicleId: string, data: any): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicles/${vehicleId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async approveVehicleAdmin(vehicleId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicles/${vehicleId}/approve`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async rejectVehicleAdmin(vehicleId: string, rejectionReason: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicles/${vehicleId}/reject`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      }
    );
    return this.handleResponse(response);
  }

  async getVehicleStatistics(): Promise<{
    total_vehicles: number;
    active_vehicles: number;
    inactive_vehicles: number;
    pending_vehicles: number;
    approved_vehicles: number;
    rejected_vehicles: number;
  }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicles/statistics/overview`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  // Admin Vehicle Category endpoints
  async getAllVehicleCategories(skip: number = 0, limit: number = 100, activeOnly: boolean = false): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-categories?skip=${skip}&limit=${limit}&active_only=${activeOnly}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async createVehicleCategory(data: { category_name: string; status?: boolean }): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-categories`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async getVehicleCategory(categoryId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-categories/${categoryId}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateVehicleCategory(categoryId: string, data: { category_name?: string; status?: boolean }): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-categories/${categoryId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async deleteVehicleCategory(categoryId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-categories/${categoryId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getVehicleCategoryStatistics(): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-categories/statistics`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // Admin Vehicle Type endpoints
  async getAllVehicleTypes(skip: number = 0, limit: number = 100, activeOnly: boolean = false, withCategory: boolean = false): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-types?skip=${skip}&limit=${limit}&active_only=${activeOnly}&with_category=${withCategory}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async createVehicleType(data: {
    model_type: string;
    vehicle_category_id: string;
    brand_type_id?: string;
    seats: number;
    base_km: number;
    base_fare_ac: number;
    base_fare_non_ac: number;
    per_km_charge_ac: number;
    per_km_charge_non_ac: number;
    base_fare_commission: number;
    per_km_commission: number;
    status?: boolean;
  }): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-types`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async getVehicleType(vehicleTypeId: string, withCategory: boolean = false): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-types/${vehicleTypeId}?with_category=${withCategory}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateVehicleType(vehicleTypeId: string, data: {
    model_type?: string;
    vehicle_category_id?: string;
    brand_type_id?: string;
    seats?: number;
    base_km?: number;
    base_fare_ac?: number;
    base_fare_non_ac?: number;
    per_km_charge_ac?: number;
    per_km_charge_non_ac?: number;
    base_fare_commission?: number;
    per_km_commission?: number;
    status?: boolean;
  }): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-types/${vehicleTypeId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async deleteVehicleType(vehicleTypeId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-types/${vehicleTypeId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getVehicleTypeStatistics(): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-types/statistics`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getVehicleTypesByCategory(categoryId: string, activeOnly: boolean = false): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/vehicle-types/by-category/${categoryId}?active_only=${activeOnly}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // Public Vehicle Type endpoints (for owners)
  async listVehicleCategories(activeOnly: boolean = true): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/vehicles/categories/list?active_only=${activeOnly}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async listVehicleTypes(categoryId?: string, activeOnly: boolean = true): Promise<any> {
    let url = `${this.baseURL}/api/v1/vehicles/types/list?active_only=${activeOnly}`;
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async calculateBookingPrice(data: {
    vehicle_id: string;
    src_lat: number;
    src_long: number;
    dest_lat: number;
    dest_long: number;
    is_ac?: boolean;
  }): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/bookings/calculate-price`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  // Admin Bookings endpoints
  async getAllBookings(skip: number = 0, limit: number = 100, status?: string): Promise<any> {
    let url = `${this.baseURL}/api/v1/admin/bookings?skip=${skip}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteBookingAdmin(bookingId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/bookings/${bookingId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateBookingStatusAdmin(bookingId: string, status: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      }
    );
    return this.handleResponse(response);
  }

  // Booking with Payment endpoints
  async createBookingWithPayment(data: BookingCreate): Promise<{
    booking: Booking;
    razorpay_order: RazorpayOrder;
  }> {
    const response = await fetch(`${this.baseURL}/api/v1/bookings/create`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async verifyPayment(data: PaymentVerification): Promise<Booking> {
    const response = await fetch(`${this.baseURL}/api/v1/bookings/verify-payment`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async getMyBookings(skip: number = 0, limit: number = 100): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/bookings/my-bookings?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getBookingById(bookingId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/bookings/${bookingId}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async cancelBooking(bookingId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/bookings/${bookingId}/cancel`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async markBookingCompleted(bookingId: string): Promise<Booking> {
    const response = await fetch(
      `${this.baseURL}/api/v1/bookings/${bookingId}/complete`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async getOwnerBookings(skip: number = 0, limit: number = 100): Promise<any> {
    const user = await this.getProfile();
    // For sub-owners, use parent owner_id; otherwise use user's own id
    const ownerId = user.is_owner_sub_user && user.owner_id ? user.owner_id : user.id;
    const response = await fetch(
      `${this.baseURL}/api/v1/bookings/owner/${ownerId}?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // Review endpoints
  async createReview(data: ReviewCreate): Promise<Review> {
    const response = await fetch(`${this.baseURL}/api/v1/reviews/create`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async getVehicleReviews(
    vehicleId: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/reviews/vehicle/${vehicleId}?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
      }
    );
    return this.handleResponse(response);
  }

  async getVehicleRating(vehicleId: string): Promise<VehicleRating> {
    const response = await fetch(
      `${this.baseURL}/api/v1/reviews/vehicle/${vehicleId}/rating`,
      {
        method: "GET",
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async getMyReviews(skip: number = 0, limit: number = 100): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/reviews/my-reviews?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async checkReviewEligibility(bookingId: string): Promise<ReviewEligibility> {
    const response = await fetch(
      `${this.baseURL}/api/v1/reviews/booking/${bookingId}/eligibility`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async getReviewByBooking(bookingId: string): Promise<Review> {
    const response = await fetch(
      `${this.baseURL}/api/v1/reviews/booking/${bookingId}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async getDriverReviews(skip: number = 0, limit: number = 100): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/reviews/driver/my-reviews?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getOwnerVehicleReviews(
    vehicleId?: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<any> {
    let url = `${this.baseURL}/api/v1/reviews/owner/vehicle-reviews?skip=${skip}&limit=${limit}`;
    if (vehicleId) {
      url += `&vehicle_id=${vehicleId}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Admin Review endpoints
  async getAllReviewsAdmin(
    skip: number = 0,
    limit: number = 100,
    isActive?: boolean
  ): Promise<any> {
    let url = `${this.baseURL}/api/v1/admin/reviews?skip=${skip}&limit=${limit}`;
    if (isActive !== undefined) {
      url += `&is_active=${isActive}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async toggleReviewStatus(reviewId: string, isActive: boolean): Promise<Review> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/reviews/${reviewId}/status`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async deleteReviewAdmin(reviewId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/reviews/${reviewId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getReviewStatistics(): Promise<{
    total_reviews: number;
    active_reviews: number;
    inactive_reviews: number;
    average_rating: number;
  }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/reviews/statistics/overview`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  // ==================== Coupon Endpoints ====================

  // User Coupon endpoints
  async validateCoupon(couponCode: string): Promise<{
    is_valid: boolean;
    message: string;
    discount_value: number;
    coupon?: any;
  }> {
    const response = await fetch(`${this.baseURL}/api/v1/coupons/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coupon_code: couponCode }),
    });
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async applyCoupon(
    couponCode: string,
    bookingAmount: number
  ): Promise<{
    original_amount: number;
    discount_value: number;
    discount_amount: number;
    final_amount: number;
    coupon_code: string;
  }> {
    const response = await fetch(`${this.baseURL}/api/v1/coupons/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coupon_code: couponCode,
        booking_amount: bookingAmount,
      }),
    });
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  // Admin Coupon endpoints
  async createCoupon(couponData: {
    title: string;
    description: string;
    valid_from: string;
    valid_till: string;
    coupon_code: string;
    discount_value: number;
  }): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/coupons`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(couponData),
    });
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async getAllCoupons(
    skip: number = 0,
    limit: number = 100,
    activeOnly: boolean = false
  ): Promise<any> {
    const url = `${this.baseURL}/api/v1/admin/coupons?skip=${skip}&limit=${limit}&active_only=${activeOnly}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getActiveCoupons(skip: number = 0, limit: number = 100): Promise<any> {
    const url = `${this.baseURL}/api/v1/admin/coupons/active?skip=${skip}&limit=${limit}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getCouponById(couponId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/coupons/${couponId}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async updateCoupon(
    couponId: string,
    couponData: {
      title?: string;
      description?: string;
      valid_from?: string;
      valid_till?: string;
      coupon_code?: string;
      discount_value?: number;
    }
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/coupons/${couponId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(couponData),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async toggleCouponStatus(couponId: string, isActive: boolean): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/coupons/${couponId}/status`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async deleteCoupon(couponId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/coupons/${couponId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getCouponStatistics(): Promise<{
    total_coupons: number;
    active_coupons: number;
    inactive_coupons: number;
    valid_coupons: number;
    expired_coupons: number;
    average_discount: number;
  }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/coupons/statistics/overview`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  // Blog endpoints (Public)
  async getPublishedBlogs(skip: number = 0, limit: number = 100, search?: string): Promise<any> {
    let url = `${this.baseURL}/api/v1/blogs?skip=${skip}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return this.handleResponse(response);
  }

  async getBlogBySlug(slug: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/blogs/${slug}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  // Admin Blog endpoints
  async createBlog(blogData: {
    title: string;
    content: string;
    status?: string;
    custom_slug?: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/blogs`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(blogData),
    });
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async getAllBlogs(
    skip: number = 0,
    limit: number = 100,
    statusFilter?: string,
    search?: string
  ): Promise<any> {
    let url = `${this.baseURL}/api/v1/admin/blogs?skip=${skip}&limit=${limit}`;
    if (statusFilter) {
      url += `&status_filter=${statusFilter}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getBlogById(blogId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/blogs/${blogId}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async updateBlog(
    blogId: string,
    blogData: {
      title?: string;
      content?: string;
      status?: string;
      custom_slug?: string;
    }
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/blogs/${blogId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(blogData),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async updateBlogStatus(blogId: string, status: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/blogs/${blogId}/status`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async deleteBlog(blogId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/blogs/${blogId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getBlogStatistics(): Promise<{
    total_blogs: number;
    published_blogs: number;
    draft_blogs: number;
    archived_blogs: number;
  }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/blogs/statistics/overview`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  // Permission endpoints
  async getAllPermissions(
    skip: number = 0,
    limit: number = 100,
    activeOnly: boolean = false
  ): Promise<Permission[]> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/permissions?skip=${skip}&limit=${limit}&active_only=${activeOnly}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<Permission[]>(response);
  }

  async getPermission(permissionId: string): Promise<Permission> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/permissions/${permissionId}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<Permission>(response);
  }

  async createPermission(data: PermissionCreate): Promise<Permission> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/permissions`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Permission>(response);
  }

  async updatePermission(
    permissionId: string,
    data: PermissionUpdate
  ): Promise<Permission> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/permissions/${permissionId}`,
      {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<Permission>(response);
  }

  async deletePermission(permissionId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/permissions/${permissionId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<{ message: string }>(response);
  }

  // Sub-Admin endpoints
  async getAllSubAdmins(
    skip: number = 0,
    limit: number = 100
  ): Promise<User[]> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/sub-admins?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<User[]>(response);
  }

  async createSubAdmin(data: SubAdminCreate): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/v1/admin/sub-admins`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<User>(response);
  }

  async updateSubAdmin(userId: string, data: SubAdminUpdate): Promise<User> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/sub-admins/${userId}`,
      {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse<User>(response);
  }

  async deleteSubAdmin(userId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/sub-admins/${userId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<{ message: string }>(response);
  }

  async toggleSubAdminStatus(userId: string): Promise<User> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/sub-admins/${userId}/toggle-status`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<User>(response);
  }

  async assignPermissionsToUser(
    userId: string,
    permissionIds: string[]
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/users/${userId}/permissions`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          permission_ids: permissionIds,
        }),
      }
    );
    return this.handleResponse<{ message: string }>(response);
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/users/${userId}/permissions`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<Permission[]>(response);
  }

  async getMyPermissions(): Promise<Permission[]> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/my-permissions`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<Permission[]>(response);
  }

  // Admin Brand Type endpoints
  async getAllBrandTypes(
    skip: number = 0,
    limit: number = 100,
    activeOnly: boolean = false
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/brand-types?skip=${skip}&limit=${limit}&active_only=${activeOnly}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async createBrandType(data: {
    brand_type: string;
    is_active?: boolean;
    priority?: number;
  }): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/brand-types`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async getBrandType(brandTypeId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/brand-types/${brandTypeId}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateBrandType(
    brandTypeId: string,
    data: {
      brand_type?: string;
      is_active?: boolean;
      priority?: number;
    }
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/brand-types/${brandTypeId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async deleteBrandType(brandTypeId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/brand-types/${brandTypeId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async updateBrandTypePriority(
    brandTypeId: string,
    priority: number
  ): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/brand-types/${brandTypeId}/priority`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ priority }),
      }
    );
    return this.handleResponse(response);
  }

  async getBrandTypeStatistics(): Promise<{
    total_brand_types: number;
    active_brand_types: number;
    inactive_brand_types: number;
  }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/brand-types/statistics`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  // Public Brand Type endpoint (for owners/forms)
  async listBrandTypes(activeOnly: boolean = true): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/brand-types?active_only=${activeOnly}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // Admin Owner KYC Management endpoints
  async getAdminOwnerKYC(
    skip: number = 0,
    limit: number = 100,
    status?: string,
    search?: string
  ): Promise<any> {
    let url = `${this.baseURL}/api/v1/admin/owner-kyc?skip=${skip}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAdminOwnerKYCById(kycId: string): Promise<OwnerKYCWithAudit> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/owner-kyc/${kycId}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async createAdminOwnerKYC(data: AdminOwnerKYCCreate): Promise<OwnerKYCWithAudit> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/owner-kyc`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async updateAdminOwnerKYC(
    kycId: string,
    data: AdminOwnerKYCUpdate
  ): Promise<OwnerKYCWithAudit> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/owner-kyc/${kycId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async verifyAdminOwnerKYC(
    kycId: string,
    data: AdminKYCVerifyRequest
  ): Promise<OwnerKYCWithAudit> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/owner-kyc/${kycId}/verify`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    const result = await this.handleResponse<any>(response);
    return result.data;
  }

  async getOwnerKYCAuditHistory(
    kycId: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<{ data: AuditLogEntry[]; total: number }> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/owner-kyc/${kycId}/audit-history?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  async getEligibleUsersForKYC(
    skip: number = 0,
    limit: number = 100,
    search?: string
  ): Promise<{ data: EligibleUser[]; total: number }> {
    let url = `${this.baseURL}/api/v1/admin/owner-kyc/users/eligible?skip=${skip}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteAdminOwnerKYC(kycId: string): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/api/v1/admin/owner-kyc/${kycId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );
    await this.handleResponse(response);
  }

  // Logout
  logout(): void {
    this.removeToken();
  }
}

export const apiClient = new APIClient(API_URL);
