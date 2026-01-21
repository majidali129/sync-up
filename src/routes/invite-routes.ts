import { acceptInvite, getGlobalInvites, getWorkspaceInvites, sendInvite } from "@/controllers/workspace-invites-controller";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { Router } from "express";


const router = Router({ mergeParams: true });


router.use(verifyJWT);
router.route('/').post(sendInvite).get(getWorkspaceInvites)
router.route('/global').get(getGlobalInvites);
router.route('/:id/accept').post(acceptInvite);



export { router as inviteRouter };
export default router;