import { createWorkspace, deleteWorkspace, getWorkspaceDetails, getAllWorkspaces, updateWorkspace } from "@/controllers/workspace-controller";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { Router } from "express";
import { inviteRouter } from "./invite-routes";
import { projectRouter } from "./project-routes";
import { verifyWorkspaceOwnerShip } from "@/middlewares/verify-workspace-ownership";


const router = Router()

router.use('/:workspaceId/invites', inviteRouter) // Mount invite routes under workspace routes i.e. /workspaces/:workspaceId/invites
router.use('/:workspaceId/projects', projectRouter) // Mount project routes under workspace routes i.e. /workspaces/:workspaceId/projects

router.use(verifyJWT);
router.route('/').post(createWorkspace).get(getAllWorkspaces);
router.route('/:workspaceId')
    .get(verifyWorkspaceOwnerShip(['owner', 'admin', 'member']), getWorkspaceDetails)
    .patch(verifyWorkspaceOwnerShip(['owner']), updateWorkspace)
    .delete(verifyWorkspaceOwnerShip(['owner']), deleteWorkspace);

export { router as workspaceRouter }
export default router;