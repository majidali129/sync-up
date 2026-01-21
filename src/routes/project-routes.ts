import { addProjectMember, createProject, deleteProject, getProjectDetails, getProjectMembers, getProjects, removeProjectMember, updateProject, updateProjectStatus } from "@/controllers/project-controller";
import { verifyJWT } from "@/middlewares/verify-jwt";
import { verifyWorkspaceOwnerShip } from "@/middlewares/verify-workspace-ownership";
import { Router } from "express";



const router = Router({ mergeParams: true });

router.use(verifyJWT);

router.route('/').post(verifyWorkspaceOwnerShip(['owner', 'admin']), createProject).get(verifyWorkspaceOwnerShip(['owner', 'admin', 'member', 'viewer']), getProjects);

router.get('/:id', verifyWorkspaceOwnerShip(['owner', 'admin', 'member', 'viewer']), getProjectDetails)

router.post('/:id/members',
    verifyWorkspaceOwnerShip(['owner', 'admin']),
    addProjectMember
);

router.delete('/:id/members/:memberId',
    verifyWorkspaceOwnerShip(['owner', 'admin']),
    removeProjectMember
);

router.get('/:id/members',
    verifyWorkspaceOwnerShip(['owner', 'admin', 'member', 'viewer']),
    getProjectMembers
);

router.use(verifyWorkspaceOwnerShip(['owner', 'admin']))
router.route('/:id').patch(updateProject).delete(deleteProject);
router.route('/:id/status').patch(updateProjectStatus);


export { router as projectRouter }
export default router;

/*
! Who can do THIS: addMembersToWorkspace | updateWorkspaceSettings => only ( owner )
! Who can do THIS:  create/edit/delete project | updateProjectStatus | addOrRemoveMembersToAndFromProject |assignOrUnassignTaskToProjectMember => only  ( owner | admin )
! Admin can assign task to (role) member only 
! Owner can assign task to (role) admin | member 
*/