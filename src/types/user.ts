export type USER_ROLE = 'admin' | 'owner' | 'member' | 'viewer'
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
    refreshToken?: string;
    isEmailVerified: boolean;
    accountStatus: ACCOUNT_STATUS;
    banReason: string;
    bannedUntil: Date;
    isOnline: boolean;
    lastSeen: Date;
}