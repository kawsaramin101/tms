export declare const USER_ROLES: readonly ["ADMIN", "TREASURER", "INVENTORY_OFFICER", "MANAGEMENT", "MEMBER"];
export type UserRole = (typeof USER_ROLES)[number];
export declare const USER_STATUSES: readonly ["ACTIVE", "INACTIVE"];
export type UserStatus = (typeof USER_STATUSES)[number];
export interface UserDto {
    userId: number;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    token: string;
    user: UserDto;
}
export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    phone?: string | undefined;
    role: UserRole;
}
export interface UpdateUserRequest {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | null | undefined;
    role?: UserRole | undefined;
}
export interface UpdateUserStatusRequest {
    status: UserStatus;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface AuthTokenPayload {
    userId: number;
    role: UserRole;
}
export interface ApiMessage {
    message: string;
}
//# sourceMappingURL=auth.types.d.ts.map