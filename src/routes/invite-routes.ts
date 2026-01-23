import { acceptInvite, getGlobalInvites, getWorkspaceInvites, sendInvite } from "@/controllers/workspace-invites-controller";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { verifyWorkspaceOwnerShip } from "@/middlewares/verify-workspace-ownership";
import { Router } from "express";


const router = Router({ mergeParams: true });


router.use(verifyJWT);

router.route('/')
    .post(verifyWorkspaceOwnerShip(['owner']), sendInvite)
    .get(verifyWorkspaceOwnerShip(['owner']), getWorkspaceInvites);

router.get('/global', getGlobalInvites);

router.post('/:id/accept', acceptInvite);



export { router as inviteRouter };
export default router;