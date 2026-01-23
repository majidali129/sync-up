import { config } from "@/config/env";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema, updatePasswordSchema } from "@/schemas/auth";
import { authService } from "@/services/auth-service";
import { UserContext } from "@/types/user";
import { apiResponse } from "@/utils/api-response";
import { asyncHandler } from "@/utils/async-handler";
import { Request } from "express";

const getCtx = (req: Request): UserContext => ({
    userId: req.user.id,
    email: req.user.email,
    token: req.query.token as string
})

export const signUp = asyncHandler(async (req, res) => {
    const result = await authService.signUpUser(signUpSchema.parse(req.body));
    const message = result.isNewUser
        ? 'Account created successfully. Please check your email to verify your account.'
        : 'A verification email has been resent to your email address. Please check your inbox.';

    return apiResponse(res, 201, message, { ...result })
})

export const verifyEmail = asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(getCtx(req));
    return apiResponse(res, result.status, result.message)
})

export const signIn = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.signInUser(signInSchema.parse(req.body))

    // 2. Set cookies
    res.cookie('access-token', accessToken, { httpOnly: true, sameSite: "lax", secure: config.NODE_ENV === 'production' });
    res.cookie('refresh-token', refreshToken, { httpOnly: true, sameSite: "lax", secure: config.NODE_ENV === 'production' });

    // send response
    return apiResponse(res, 200, 'Signed in successfully', { user: user._id })
});

export const signOut = asyncHandler(async (req, res) => {
    await authService.signOutUser(getCtx(req));

    res.clearCookie('access-token', { path: '/' });
    res.clearCookie('refresh-token', { path: '/' });

    return apiResponse(res, 200, 'Signed out successfully', null);
})
export const forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(forgotPasswordSchema.parse(req.body))
    return apiResponse(res, result.status, result.message);
})
export const resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(getCtx(req), resetPasswordSchema.parse(req.body))
    return apiResponse(res, result.status, result.message);
})
export const updatePassword = asyncHandler(async (req, res) => {
    const data = updatePasswordSchema.parse(req.body)
    await authService.updatePassword(getCtx(req), data);
    return apiResponse(res, 200, 'Password updated successfully', null);
})
export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(getCtx(req));
    return apiResponse(res, 200, 'Current user fetched successfully', { user });
})