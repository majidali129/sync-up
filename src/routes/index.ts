import { Router } from "express";
import { authRouter } from "./auth-routes";
import { workspaceRouter } from "./workspace-routes";
import { inviteRouter } from "./invite-routes";



const router = Router()


router.use('/auth', authRouter)
router.use('/workspaces', workspaceRouter)
router.use('/invites', inviteRouter)


export { router as appRouter }
export default router;