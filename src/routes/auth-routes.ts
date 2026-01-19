
import { forgotPassword, getCurrentUser, resetPassword, signIn, signOut, signUp, updatePassword, verifyEmail } from "@/controllers/auth-controller";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { Router } from "express";



const router = Router()


router.post('/sign-up', signUp)
router.post('/verify-email', verifyEmail)
router.post('/sign-in', signIn)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.use(verifyJWT);
router.post('/update-password', updatePassword)
router.post('/sign-out', signOut)
router.post('/current-user', getCurrentUser)

export { router as authRoutes }
export default router;