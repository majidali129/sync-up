import { config } from "@/config/env";
import { resend } from "./resend.client";


type SendEmailParams = {
    to: string;
    subject: string;
    html: string
}
export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
    return resend.emails.send({
        to,
        from: config.EMAIL_FROM,
        subject,
        html
    })
}