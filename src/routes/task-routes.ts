import { createTask, getTasks, updateTask, deleteTask, getTaskDetails, toggleTaskStatus, assignTask, unassignTask } from "@/controllers/task-controller";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { verifyWorkspaceOwnerShip } from "@/middlewares/verify-workspace-ownership";
import { Router } from "express";




const router = Router({ mergeParams: true })
// All routes will mount under /workspaces/:workspaceId/projects/:projectId/tasks

router.use(verifyJWT);

router.route('/').post(verifyWorkspaceOwnerShip(['owner', 'admin', 'member']), createTask).get(
    verifyWorkspaceOwnerShip(['owner', 'admin', 'member']),
    getTasks);

router.route('/:id').patch(
    verifyWorkspaceOwnerShip(['owner', 'admin', 'member']),
    updateTask)
    .delete(
        verifyWorkspaceOwnerShip(['owner', 'admin', 'member']),
        deleteTask).get(
            verifyWorkspaceOwnerShip(['owner', 'admin', 'member']),
            getTaskDetails);

router.post('/:id/toggle-status', verifyWorkspaceOwnerShip(['owner', 'admin', 'member']), toggleTaskStatus);

router.post('/:id/assign', verifyWorkspaceOwnerShip(['owner', 'admin']), assignTask);
router.delete('/:id/assign',
    verifyWorkspaceOwnerShip(['owner', 'admin']),
    unassignTask);


export { router as taskRouter }
export default router;