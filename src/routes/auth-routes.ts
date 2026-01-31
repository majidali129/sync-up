
import { forgotPassword, getCurrentUser, refreshToken, resetPassword, signIn, signOut, signUp, updatePassword, verifyEmail } from "@/controllers/auth-controller";
import { validateBody } from "@/middlewares/validate-request";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema, updatePasswordSchema } from "@/schemas/auth";
import { Router } from "express";
import rateLimit from "express-rate-limit";


const signInLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 5,
    message: {
        error: 'Too many authentication attempts',
        retryAfter: '10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,

})

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    message: {
        error: 'Too many password reset requests',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,

})

const router = Router()


router.post('/sign-up', validateBody(signUpSchema), signUp)
router.post('/verify-email', verifyEmail)
router.post('/sign-in', signInLimiter, validateBody(signInSchema), signIn)
router.post('/forgot-password', forgotPasswordLimiter, validateBody(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword)
router.post('/refresh-token', refreshToken)
router.use(verifyJWT);
router.post('/update-password', validateBody(updatePasswordSchema), updatePassword)
router.post('/sign-out', signOut)
router.get('/current-user', getCurrentUser)

export { router as authRouter }
export default router;