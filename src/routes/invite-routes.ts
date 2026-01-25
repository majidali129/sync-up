import { acceptInvite, getGlobalInvites, getWorkspaceInvites, sendInvite } from "@/controllers/workspace-invites-controller";
import { validateBody } from "@/middlewares/validate-request";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { verifyWorkspaceOwnerShip } from "@/middlewares/verify-workspace-ownership";
import { acceptInviteSchema, workspaceInviteSchema } from "@/schemas/workspace-invite";
import { Router } from "express";

const router = Router({ mergeParams: true });


router.use(verifyJWT);

router.route('/')
    .post(verifyWorkspaceOwnerShip(['owner']), validateBody(workspaceInviteSchema), sendInvite)
    .get(verifyWorkspaceOwnerShip(['owner']), getWorkspaceInvites);

router.get('/global', getGlobalInvites);

router.post('/:id/accept', validateBody(acceptInviteSchema), acceptInvite);



export { router as inviteRouter };
export default router;