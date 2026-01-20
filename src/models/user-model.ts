import { IUser } from "@/types/user";
import mongoose, { HydratedDocument, model, Schema } from "mongoose";


type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<UserDocument>({
	username: {
		type: String,
		required: [true, 'Username is required'],
		min: [3, 'Username must be 3 characters long'],
		max: [30, 'Username cannot exceed 30 characters'],
		unique: true,
		trim: true,
		lowercase: true,
		match: [/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, underscores, and hyphens']
	},
	fullName: {
		type: String,
		required: [true, 'Full name is required'],
		trim: true,
		min: [2, 'Full name must be at least 2 characters'],
		max: [100, 'Full name cannot exceed 100 characters']
	},
	email: {
		type: String,
		required: [true, 'Email is required'],
		unique: true,
		trim: true,
		lowercase: true,
		match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
	},
	password: {
		type: String,
		required: [true, 'Password is required'],
		min: [8, 'Password must be at least 8 characters long'],
		max: [100, 'Password cannot exceed 100 characters'],
		select: false
	},
	profilePhoto: {
		type: String,
		default: null,
	},
	refreshToken: {
		type: String,
		default: null,
		select: false
	},
	emailVerificationToken: {
		type: String,
		default: null
	},
	emailVerificationTokenExpires: {
		type: Date,
		default: null
	},
	emailVerifiedAt: {
		type: Date,
		default: null
	},
	passwordResetToken: {
		type: String,
		default: null
	},
	passwordResetTokenExpires: {
		type: Number,
		default: null
	},
	passwordResetTokenIssuedAt: {
		type: Date,
		default: null
	},
	passwordChangedAt: {
		type: Date,
		default: null
	},
	isEmailVerified: {
		type: Boolean,
		default: false
	},
	accountStatus: {
		type: String,
		enum: {
			values: ['active', 'banned'],
			message: 'Account status must be either active or banned'
		},
		default: 'active'
	},
	banReason: {
		type: String,
		default: null
	},
	bannedUntil: {
		type: Date,
		default: null
	},
	isOnline: {
		type: Boolean,
		default: false
	},
	lastSeen: {
		type: Date,
		default: null
	},
	lastLoginAt: {
		type: Date,
		default: null
	}
}, { timestamps: true });



export const User = mongoose.models?.User || model<UserDocument>('User', userSchema);