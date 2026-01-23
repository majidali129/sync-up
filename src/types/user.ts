export type USER_ROLE = 'admin' | 'owner' | 'member'
export type ACCOUNT_STATUS = 'active' | 'banned'

export interface IUser {
    username: string;
    fullName: string;
    email: string;
    password: string;
    profilePhoto?: string;
    emailVerificationToken?: string;
    emailVerificationTokenExpires?: Date;
    emailVerifiedAt?: Date;
    passwordResetToken?: string;
    passwordResetTokenExpires?: Date;
    passwordResetTokenIssuedAt?: Date;
    passwordChangedAt?: Date;
    refreshToken?: string;
    isEmailVerified: boolean;
    accountStatus: ACCOUNT_STATUS;
    banReason: string;
    bannedUntil: Date;
    isOnline: boolean;
    lastSeen: Date;
    lastLoginAt?: Date;
}

export interface UserContext {
    userId: string;
    email: string;
    token: string
}