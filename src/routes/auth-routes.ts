
import { forgotPassword, getCurrentUser, resetPassword, signIn, signOut, signUp, updatePassword } from "@/controllers/auth-controller";
import { Router } from "express";



const router = Router()


router.post('/sign-up', signUp)
router.post('/sign-in', signIn)
router.post('/sign-out', signOut)
router.post('/me', getCurrentUser)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/update-password', updatePassword)

export { router as authRoutes }
export default router;