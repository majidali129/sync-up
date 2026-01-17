import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUserDocument, UserPreferences } from '../types/user';

const userPreferencesSchema = new Schema<UserPreferences>(
	{
		theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
		language: { type: String, default: 'en' },
		notifications: { type: Boolean, default: true },
		emailDigest: { type: Boolean, default: true }
	},
	{ _id: false }
);

const userSchema = new Schema<IUserDocument>(
	{
		username: {
			type: String,
			required: [true, 'Username is required'],
			unique: true,
			trim: true,
			lowercase: true,
			minlength: [3, 'Username must be at least 3 characters'],
			maxlength: [30, 'Username cannot exceed 30 characters'],
			match: [/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, underscores, and hyphens']
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
			minlength: [8, 'Password must be at least 8 characters'],
			select: false
		},
		fullName: {
			type: String,
			required: [true, 'Full name is required'],
			trim: true,
			minlength: [2, 'Full name must be at least 2 characters'],
			maxlength: [100, 'Full name cannot exceed 100 characters']
		},
		avatar: {
			type: String,
			default: null
		},
		bio: {
			type: String,
			maxlength: [500, 'Bio cannot exceed 500 characters'],
			default: null
		},
		timezone: {
			type: String,
			default: 'UTC'
		},
		jobTitle: {
			type: String,
			maxlength: [100, 'Job title cannot exceed 100 characters'],
			default: null
		},
		department: {
			type: String,
			maxlength: [100, 'Department cannot exceed 100 characters'],
			default: null
		},
		phoneNumber: {
			type: String,
			match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number'],
			default: null
		},
		isEmailVerified: {
			type: Boolean,
			default: false
		},
		emailVerificationToken: {
			type: String,
			select: false,
			default: null
		},
		passwordResetToken: {
			type: String,
			select: false,
			default: null
		},
		passwordResetExpires: {
			type: Date,
			select: false,
			default: null
		},
		role: {
			type: String,
			enum: ['user', 'admin', 'moderator'],
			default: 'user'
		},
		status: {
			type: String,
			enum: ['active', 'suspended', 'banned'],
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
		lastSeen: {
			type: Date,
			default: Date.now
		},
		isOnline: {
			type: Boolean,
			default: false
		},
		refreshToken: {
			type: String,
			default: null
		},
		preferences: {
			type: userPreferencesSchema,
			default: () => ({})
		},
		workspaces: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Workspace'
			}
		]
	},
	{
		timestamps: true,
	}
);

// Indexes
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function () {
	if (!this.isModified('password')) return;

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument>('User', userSchema);
