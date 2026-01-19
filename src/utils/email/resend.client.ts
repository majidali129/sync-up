import { config } from "@/config/env";
import { Resend } from "resend";


export const resend = new Resend(config.RESEND_API_KEY);