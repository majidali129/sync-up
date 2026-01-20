import { Router } from "express";
import { authRouter } from "./auth-routes";
import { workspaceRouter } from "./workspace-routes";



const router = Router()


router.use('/auth', authRouter)
router.use('/workspaces', workspaceRouter)


export { router as appRouter }
export default router;