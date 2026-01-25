import z from "zod";

// Sign Up Schema
export const signUpSchema = z.object({
	username: z
		.string().refine(username => username.length > 0, { message: "Username is required" })
		.min(3, "Username must be at least 3 characters")
		.max(30, "Username cannot exceed 30 characters")
		.regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, underscores, and hyphens"),
	fullName: z
		.string().refine(fullName => fullName.length > 0, { message: "Full name is required" })
		.min(2, "Full name must be at least 2 characters")
		.max(100, "Full name cannot exceed 100 characters")
		.trim(),
	email: z
		.email("Please provide a valid email address"),
	password: z
		.string().refine(password => password.length > 0, { message: "Password is required" })
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password cannot exceed 128 characters")
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
});

// Sign In Schema
export const signInSchema = z.object({
	email: z
		.email("Please provide a valid email address"),
	password: z
		.string()
		.min(1, "Password is required"),
	inviteToken: z.string().optional()
});

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
	email: z
		.email("Please provide a valid email address")

});

// Reset Password Schema
export const resetPasswordSchema = z.object({
	newPassword: z
		.string().refine(password => password.length > 0, { message: "New password is required" })
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password cannot exceed 128 characters")
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number")
});

// Update Password Schema
export const updatePasswordSchema = z.object({
	currentPassword: z
		.string().refine(password => password.length > 0, { message: "Old password is required" }),
	newPassword: z
		.string().refine(password => password.length > 0, { message: "New password is required" })
		.min(8, "New password must be at least 8 characters")
		.max(128, "New password cannot exceed 128 characters")
}).refine((data) => data.currentPassword !== data.newPassword, {
	message: "New password must be different from current password",
	path: ["newPassword"]
});


// Refresh Token Schema
export const refreshTokenSchema = z.object({
	refreshToken: z
		.string()
		.min(1, "Refresh token is required")
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;