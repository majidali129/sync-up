import { createTask, getTasks, updateTask, deleteTask, getTaskDetails, toggleTaskStatus, assignTask, unassignTask } from "@/controllers/task-controller";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { verifyProjectMembership } from "@/middlewares/verify-project-membership";
import { verifyWorkspaceOwnerShip } from "@/middlewares/verify-workspace-ownership";
import { Router } from "express";




const router = Router({ mergeParams: true })
// All routes will mount under /workspaces/:workspaceId/projects/:projectId/tasks

router.use(verifyJWT);

router.route('/').post(verifyWorkspaceOwnerShip(['owner', 'admin', 'member']), verifyProjectMembership, createTask).get(
    verifyWorkspaceOwnerShip(['owner', 'admin', 'member']),
    verifyProjectMembership,
    getTasks);

router.route('/:id').patch(
    verifyWorkspaceOwnerShip(['owner', 'admin', 'member']),
    verifyProjectMembership,
    updateTask)
    .delete(
        verifyWorkspaceOwnerShip(['owner', 'admin', 'member']),
        verifyProjectMembership,
        deleteTask).get(
            verifyWorkspaceOwnerShip(['owner', 'admin', 'member']),
            verifyProjectMembership,
            getTaskDetails);

router.post('/:id/toggle-status', verifyWorkspaceOwnerShip(['owner', 'admin', 'member']), verifyProjectMembership, toggleTaskStatus);

router.post('/:id/assign', verifyWorkspaceOwnerShip(['owner', 'admin']), verifyProjectMembership, assignTask);
router.delete('/:id/assign',
    verifyWorkspaceOwnerShip(['owner', 'admin']),
    verifyProjectMembership,
    unassignTask);


export { router as taskRouter }
export default router;