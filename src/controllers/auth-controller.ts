import { config } from "@/config/env";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema, updatePasswordSchema, verifyEmailSchema } from "@/schemas/auth";
import { authService } from "@/services/auth-service";
import { apiResponse } from "@/utils/api-response";
import { asyncHandler } from "@/utils/async-handler";

export const signUp = asyncHandler(async (req, res) => {
    const signUpData = signUpSchema.parse(req.body);
    const result = await authService.signUpUser(signUpData);
    const message = result.isNewUser
        ? 'Account created successfully. Please check your email to verify your account.'
        : 'A verification email has been resent to your email address. Please check your inbox.';

    return apiResponse(res, 201, message, { ...result })
})

export const verifyEmail = asyncHandler(async (req, res) => {
    const { token, userId } = verifyEmailSchema.parse({ token: req.query.token, userId: req.query.userId });

    const result = await authService.verifyEmail(token, userId);
    return apiResponse(res, result.status, result.message)
})

export const signIn = asyncHandler(async (req, res) => {
    const signInData = signInSchema.parse(req.body);

    const { user, accessToken, refreshToken } = await authService.signInUser(signInData)

    // 2. Set cookies
    res.cookie('access-token', accessToken, { httpOnly: true, sameSite: "lax", secure: config.NODE_ENV === 'production' });
    res.cookie('refresh-token', refreshToken, { httpOnly: true, sameSite: "lax", secure: config.NODE_ENV === 'production' });

    // send response
    return apiResponse(res, 200, 'Signed in successfully', { user: user._id })
});

export const signOut = asyncHandler(async (req, res) => {
    await authService.signOutUser(req.user.id);

    res.clearCookie('access-token', { path: '/' });
    res.clearCookie('refresh-token', { path: '/' });

    return apiResponse(res, 200, 'Signed out successfully', null);
})
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(email)
    return apiResponse(res, result.status, result.message);
})
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = resetPasswordSchema.parse({ ...req.body, token: req.query.token });
    const result = await authService.resetPassword(token, newPassword)
    return apiResponse(res, result.status, result.message);
})
export const updatePassword = asyncHandler(async (req, res) => {
    console.log(req.body)
    const data = updatePasswordSchema.parse(req.body)
    console.log(data)
    await authService.updatePassword(req.user.id, data);
    return apiResponse(res, 200, 'Password updated successfully', null);
})
export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);
    return apiResponse(res, 200, 'Current user fetched successfully', { user });
})