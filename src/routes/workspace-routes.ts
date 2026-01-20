import { createWorkspace, deleteWorkspace, getWorkspaceDetails, getAllWorkspaces, updateWorkspace } from "@/controllers/workspace-controller";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { Router } from "express";


const router = Router()

router.use(verifyJWT);
router.route('/').post(createWorkspace).get(getAllWorkspaces);
router.route('/:id').get(getWorkspaceDetails).patch(updateWorkspace).delete(deleteWorkspace)


export { router as workspaceRouter }
export default router;