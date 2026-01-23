import { User } from "@/models/user-model";
import { ForgotPasswordInput, ResetPasswordInput, SignInInput, SignUpInput } from "@/schemas/auth";
import { UserContext } from "@/types/user";
import { ApiError } from "@/utils/api-error";
import { sendResetPasswordEmail, sendVerificationEmail } from "@/utils/email/email-actions";
import { generateToken } from "@/utils/generate-token";
import { generateAccessToken, generateRefreshToken } from "@/utils/jwts";
import bcrypt from 'bcrypt'
import crypto from "node:crypto";

class AuthService {
    async signUpUser(signUpData: SignUpInput) {
        const { username, fullName, email, password } = signUpData;

        const accountWithEmail = await User.findOne({ email });
        if (accountWithEmail && accountWithEmail.isEmailVerified) {
            throw new ApiError(409, 'Email already in use');
        };

        if (accountWithEmail && !accountWithEmail.isEmailVerified) {
            try {
                const { token: emailVerificationToken, hashedToken } = generateToken()
                accountWithEmail.emailVerificationToken = hashedToken;
                accountWithEmail.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour from now
                await accountWithEmail.save({ validateBeforeSave: false });
                await sendVerificationEmail(email, emailVerificationToken, accountWithEmail._id.toString());
                return {
                    userId: accountWithEmail._id,
                    isNewUser: false,
                    verificationResent: true,
                };
            } catch (error) {
                console.error('Resend verification email failed:', error);
                accountWithEmail.emailVerificationToken = null;
                accountWithEmail.emailVerificationTokenExpires = null;
                await accountWithEmail.save({ validateBeforeSave: false });
                throw new ApiError(500, 'Failed to resend verification email. If don\'t receive the email, please try signing up again.');
            }


        }

        const accountWithUsername = await User.findOne({
            username
        })
        if (accountWithUsername) throw new ApiError(409, 'Username already in use');
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            isEmailVerified: false,
            username, fullName, email, password: hashedPassword
        });

        if (!newUser) throw new ApiError(500, 'Failed to create user');

        try {
            const { token: emailVerificationToken, hashedToken } = generateToken()
            newUser.emailVerificationToken = hashedToken;
            newUser.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour from now
            await newUser.save({ validateBeforeSave: false });
            await sendVerificationEmail(email, emailVerificationToken, newUser._id.toString());
            return {
                userId: newUser._id,
                isNewUser: true,
                verificationResent: false,
            };
        } catch (error) {
            console.error('Verification email send failed:', error);
            newUser.emailVerificationToken = null;
            newUser.emailVerificationTokenExpires = null;
            await newUser.save({ validateBeforeSave: false });
            throw new ApiError(500, 'Failed to send verification email. If don\'t receive the email, please try signing up again.');

        }


    }

    async verifyEmail(ctx: UserContext) {
        const hashedToken = crypto.createHash('sha256').update(ctx.token).digest('hex');
        const user = await User.findById(ctx.userId).select('isEmailVerified emailVerificationToken emailVerificationTokenExpires');
        if (!user) {
            throw new ApiError(404, 'User account not found');
        }

        if (user.isEmailVerified) {
            return {
                status: 200,
                message: 'Email is already verified'
            }
        }

        if (!user.isEmailVerified && !user.emailVerificationToken) {
            throw new ApiError(400, 'Invalid email verification token');
        }

        const isExpired = user.emailVerificationTokenExpires && user.emailVerificationTokenExpires < new Date();

        if (user.emailVerificationToken !== hashedToken || isExpired) {
            throw new ApiError(400, 'Invalid or expired email verification token !!!');
        }


        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationTokenExpires = null;
        user.emailVerifiedAt = new Date();
        await user.save({ validateBeforeSave: false });
        return {
            status: 200,
            message: 'Email verified successfully'
        }
    }

    async signInUser(signInData: SignInInput) {
        //TODO: handle sign in with invite token logic
        const { email, password, inviteToken } = signInData;

        const user = await User.findOne({
            email
        }).select('+password +isEmailVerified +refreshToken').exec();

        if (!user) throw new ApiError(401, 'Unauthorized: Invalid email or password');


        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) throw new ApiError(401, 'Unauthorized: Invalid email or password');

        if (!user.isEmailVerified) throw new ApiError(403, "Forbidden: Your email address has not been verified. Please check your inbox for the verification email, or use the 'Resend Verification Email' link to receive a new one.");

        // generate tokens
        const accessToken = await generateAccessToken({ email, id: user._id.toString(), username: user.username })
        const refreshToken = await generateRefreshToken({ id: user._id.toString() })
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 12); // DB only
        // update user record
        user.refreshToken = hashedRefreshToken;
        user.lastLoginAt = new Date();

        await user.save({ validateBeforeSave: false });
        // ! IF SIGN IN WITH INVITE
        //TODO: handle invite token logic

        return { user, accessToken, refreshToken };
    }

    async signOutUser(ctx: UserContext) {
        await User.findByIdAndUpdate(ctx.userId, { $set: { refreshToken: null, lastSeen: new Date() } });
    }
    async forgotPassword({ email }: ForgotPasswordInput) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError(404, 'Account with the provided email does not exist');
        }

        const { token: resetToken, hashedToken: hashedResetToken } = generateToken()

        user.passwordResetToken = hashedResetToken;
        user.passwordResetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes from now
        user.passwordResetTokenIssuedAt = new Date();

        await user.save({ validateBeforeSave: false });

        try {
            await sendResetPasswordEmail(email, resetToken);
            return {
                status: 200,
                message: 'Password reset email sent successfully'
            }
        } catch (error) {
            // In case of email sending failure, clear the reset token fields
            console.error('Error sending reset password email:', error);
            user.passwordResetToken = null;
            user.passwordResetTokenExpires = null;
            user.passwordResetTokenIssuedAt = null;
            await user.save({ validateBeforeSave: false });

            throw new ApiError(500, 'There was an error sending the email. Try again later.');
        }

    }
    async resetPassword(ctx: UserContext, { newPassword }: ResetPasswordInput) {

        const hashedToken = crypto.createHash('sha256').update(ctx.token).digest('hex');

        const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetTokenExpires: { $gt: Date.now() } }).select('password _id passwordResetToken passwordResetTokenExpires passwordChangedAt passwordResetTokenIssuedAt').exec();
        if (!user) throw new ApiError(404, 'Token is invalid or has expired');

        // check if current password is changed after token issued
        const isPasswordChangedAfterTokenIssue = user.passwordChangedAt && (
            user.passwordChangedAt.getTime() > user.passwordResetTokenIssuedAt.getTime()
        )

        if (isPasswordChangedAfterTokenIssue) {
            throw new ApiError(400, 'Password has been changed recently. Please request a new password reset.');
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.passwordChangedAt = new Date();
        user.passwordResetToken = null;
        user.passwordResetTokenExpires = null;
        user.passwordResetTokenIssuedAt = null;
        await user.save({ validateBeforeSave: false });

        return {
            status: 200,
            message: 'Password has been reset successfully'
        }
    }
    async updatePassword(ctx: UserContext, data: { currentPassword: string; newPassword: string }) {
        const { currentPassword, newPassword } = data;
        const user = await User.findById(ctx.userId).select('+password').exec();
        if (!user) throw new ApiError(404, 'User not found');

        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordMatch) throw new ApiError(401, 'Unauthorized: Current password is incorrect');

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedNewPassword;
        user.passwordChangedAt = new Date();

        await user.save({ validateBeforeSave: false });
    }
    async getCurrentUser(ctx: UserContext) {
        const user = await User.findById(ctx.userId).select('_id username fullName email profilePhoto').lean().exec();
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }

    //TODO: refresh token logic
}


export const authService = new AuthService();