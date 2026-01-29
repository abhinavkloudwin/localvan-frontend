// Auth Types
export interface SendOTPRequest {
  phone_number: string;
}

export interface SendOTPResponse {
  message: string;
  phone_number?: string;
}

export interface VerifyOTPRequest {
  phone_number: string;
  otp: string;
}

export interface VerifyOTPResponse {
  message: string;
  phone_number: string;
  requires_registration: boolean;
}

export interface ResendOTPRequest {
  phone_number: string;
}

export interface ResendOTPResponse {
  message: string;
}

export interface RegisterRequest {
  phone_number: string;
  name: string;
  email?: string;
  gender: "Male" | "Female" | "Other";
  whatsapp_consent?: boolean;
  date_of_birth?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  phone_number: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

// User Types
export interface User {
  id: string;
  mobile_number: string;
  name: string;
  email?: string;
  gender: string;
  profile_image_url?: string;
  role?: string;
  verified?: boolean;
  is_active?: boolean;
  is_sub_admin?: boolean;
  is_owner_sub_user?: boolean;
  owner_sub_role?: string;
  owner_id?: string;
  whatsapp_consent?: boolean;
  created_on?: string;
  updated_on?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  gender?: "Male" | "Female" | "Other";
  profile_image_url?: string;
}

// API Error Response
export interface APIError {
  detail: string;
}

// Booking Enums
export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REJECTED = "rejected",
}

export enum PaymentStatus {
  PENDING = "pending",
  INITIATED = "initiated",
  SUCCESS = "success",
  FAILED = "failed",
  REFUNDED = "refunded",
}

// Booking Types
export interface BookingCreate {
  vehicle_id: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM:SS
  src_lat: number;
  src_long: number;
  src_location?: string;
  dest_lat: number;
  dest_long: number;
  dest_location?: string;
  distance_km?: number;
  payment_amount: number;
  coupon_code?: string;
}

export interface Booking {
  id: string;
  vehicle_id: string;
  user_id: string;
  owner_id: string;
  driver_id?: string;
  booking_date: string;
  booking_time: string;
  src_lat: number;
  src_long: number;
  src_location?: string;
  dest_lat: number;
  dest_long: number;
  dest_location?: string;
  distance_km?: number;
  payment_amount: number;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  razorpay_order_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  vehicle_name?: string;
  vehicle_model?: string;
  vehicle_type?: string;
  vehicle_images?: string[];
  user_name?: string;
  user_mobile?: string;
  user_email?: string;
  driver_name?: string;
}

// Payment Types
export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  booking_id: string;
}

// Review Types
export interface ReviewCreate {
  booking_id: string;
  review: string;
  rating: number; // 1-5
}

export interface Review {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  user_id: string;
  booking_id: string;
  review: string;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithDetails extends Review {
  user_name?: string;
  vehicle_model?: string;
  vehicle_type?: string;
  driver_name?: string;
}

export interface VehicleRating {
  vehicle_id: string;
  average_rating: number;
  total_reviews: number;
}

export interface OwnerKYCPayload {
  full_name?: string;
  mobile_number?: string;
  email_id?: string;
  company_name?: string;
  business_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan_number?: string;
  gst_number?: string | null;
  account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
}

export interface ReviewEligibility {
  can_review: boolean;
  reason: string;
}

// Vehicle Category Types
export interface VehicleCategory {
  id: string;
  category_name: string;
  status: boolean;
  priority?: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleCategoryCreate {
  category_name: string;
  status?: boolean;
  priority?: number;
}

export interface VehicleCategoryUpdate {
  category_name?: string;
  status?: boolean;
  priority?: number;
}

// Vehicle Type Types
export interface VehicleType {
  id: string;
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
  status: boolean;
  priority?: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
  brand_type_name?: string;
}

export interface VehicleTypeCreate {
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
  priority?: number;
}

export interface VehicleTypeUpdate {
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
  priority?: number;
}

export interface PriceCalculationResponse {
  base_fare: number;
  base_km: number;
  extra_km: number;
  per_km_charge: number;
  extra_km_charge: number;
  subtotal: number;
  base_fare_commission_percent: number;
  per_km_commission_percent: number;
  base_fare_commission: number;
  per_km_commission_amount: number;
  total_commission: number;
  final_amount: number;
  distance_km: number;
  vehicle_id: string;
  vehicle_model: string;
  is_ac: boolean;
}

// Permission Types
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionCreate {
  name: string;
  resource: string;
  action: string;
  description?: string;
  is_active?: boolean;
}

export interface PermissionUpdate {
  name?: string;
  resource?: string;
  action?: string;
  description?: string;
  is_active?: boolean;
}

// Sub-Admin Types
export interface SubAdminCreate {
  name: string;
  mobile_number: string;
  email?: string;
  gender: "Male" | "Female" | "Other";
  username: string;
  password: string;
  permission_ids: string[];
}

export interface SubAdminUpdate {
  name?: string;
  email?: string;
  is_active?: boolean;
  permission_ids?: string[];
}

export interface UserPermissionAssign {
  user_id: string;
  permission_ids: string[];
}

// Brand Type Types
export interface BrandType {
  id: string;
  brand_type: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface BrandTypeCreate {
  brand_type: string;
  is_active?: boolean;
  priority?: number;
}

export interface BrandTypeUpdate {
  brand_type?: string;
  is_active?: boolean;
  priority?: number;
}

export interface BrandTypePriorityUpdate {
  priority: number;
}

// Admin Owner KYC Types
export interface AdminOwnerKYCCreate {
  mobile_number: string;
  full_name?: string;
  email_id?: string;
  company_name?: string;
  business_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan_number?: string;
  gst_number?: string;
  account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
}

export interface AdminOwnerKYCUpdate {
  full_name?: string;
  mobile_number?: string;
  email_id?: string;
  company_name?: string;
  business_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan_number?: string;
  gst_number?: string;
  account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
}

export interface OwnerInfo {
  id: string;
  name: string;
  mobile_number: string;
  email?: string;
}

export interface OwnerKYCWithAudit {
  id: string;
  owner_id: string;
  kyc_status: "pending" | "approved" | "rejected";
  full_name?: string;
  mobile_number?: string;
  email_id?: string;
  company_name?: string;
  business_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan_number?: string;
  gst_number?: string;
  account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  rejected_reason?: string;
  created_by_id?: string;
  created_by_name?: string;
  updated_by_id?: string;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
  owner?: OwnerInfo;
}

export interface AuditLogEntry {
  id: string;
  admin_id?: string;
  admin_name: string;
  resource_type: string;
  resource_id: string;
  action: "create" | "update" | "verify" | "delete";
  changes?: Record<string, any>;
  description?: string;
  ip_address?: string;
  created_at: string;
}

export interface EligibleUser {
  id: string;
  name: string;
  mobile_number: string;
  email?: string;
  created_on: string;
}

export interface AdminKYCVerifyRequest {
  status: "approved" | "rejected";
  rejected_reason?: string;
}
