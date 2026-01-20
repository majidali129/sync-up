import { config } from "@/config/env"
import { sendEmail } from "./send-email";
import { inviteTemplate, resetPasswordTemplate, verifyEmailTemplate } from "./email-templates";


export const sendVerificationEmail = async (email: string, token: string, userId: string) => {
    const link = `${config.FRONTEND_URL}/verify-email?token=${token}&userId=${userId}`;

    return sendEmail({ to: email, subject: 'Verify your email', html: verifyEmailTemplate(link) })
}

export const sendResetPasswordEmail = async (
    email: string,
    token: string,
) => {
    const link = `${config.FRONTEND_URL}/reset-password?token=${token}`;
    return sendEmail({
        to: email,
        subject: 'Reset your password',
        html: resetPasswordTemplate(link),
    });
};


export const sendInviteEmail = async ({
    email,
    inviterName,
    workspaceName,
    token,
}: {
    email: string;
    inviterName: string;
    workspaceName: string;
    token: string;
}) => {
    const link = `${config.FRONTEND_URL}/accept-invite?token=${token}`;
    return sendEmail({
        to: email,
        subject: `Invitation to ${workspaceName}`,
        html: inviteTemplate({ inviterName, workspaceName, link }),
    });
};