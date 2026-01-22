import { createWorkspace, deleteWorkspace, getWorkspaceDetails, getAllWorkspaces, updateWorkspace } from "@/controllers/workspace-controller";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { Router } from "express";
import { inviteRouter } from "./invite-routes";
import { projectRouter } from "./project-routes";


const router = Router()

router.use('/:workspaceId/invites', inviteRouter) // Mount invite routes under workspace routes i.e. /workspaces/:workspaceId/invites
router.use('/:workspaceId/projects', projectRouter) // Mount project routes under workspace routes i.e. /workspaces/:workspaceId/projects

router.use(verifyJWT);
router.route('/').post(createWorkspace).get(getAllWorkspaces);
router.route('/:id').get(getWorkspaceDetails).patch(updateWorkspace).delete(deleteWorkspace)


export { router as workspaceRouter }
export default router;