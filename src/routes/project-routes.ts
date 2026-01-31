import { addProjectMember, createProject, deleteProject, getProjectDetails, getProjectMembers, getProjects, removeProjectMember, updateProject, updateProjectStatus } from "@/controllers/project-controller";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { verifyWorkspaceOwnerShip } from "@/middlewares/verify-workspace-ownership";
import { Router } from "express";
import { taskRouter } from "./task-routes";
import { verifyProjectMembership } from "@/middlewares/verify-project-membership";
import { validateBody } from "@/middlewares/validate-request";
import { addMemberToProjectSchema, createProjectSchema, updateProjectSchema, updateProjectStatusSchema } from "@/schemas/project";



const router = Router({ mergeParams: true });
// All routes will mount under /workspaces/:workspaceId/projects
router.use('/:projectId/tasks', taskRouter) // Mount task routes under project routes i.e. /projects/:id/tasks

router.use(verifyJWT);

router.route('/').post(verifyWorkspaceOwnerShip(['owner', 'admin']), validateBody(createProjectSchema), createProject).get(verifyWorkspaceOwnerShip(['owner', 'admin', 'member']), getProjects);

router.get('/:projectId', verifyWorkspaceOwnerShip(['owner', 'admin', 'member']), getProjectDetails)

router.post('/:projectId/members',
    verifyWorkspaceOwnerShip(['owner', 'admin']),
    validateBody(addMemberToProjectSchema),
    addProjectMember
);

router.delete('/:projectId/members/:memberId',
    verifyWorkspaceOwnerShip(['owner', 'admin']),
    removeProjectMember
);

router.get('/:projectId/members',
    verifyWorkspaceOwnerShip(['owner', 'admin', 'member']),
    getProjectMembers
);

router.use(verifyWorkspaceOwnerShip(['owner', 'admin']))
router.route('/:projectId').patch(validateBody(updateProjectSchema), updateProject).delete(deleteProject);
router.route('/:projectId/status').patch(validateBody(updateProjectStatusSchema), updateProjectStatus);


export { router as projectRouter }
export default router;
