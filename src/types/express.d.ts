import * as express from 'express'
import { USER_ROLE } from './user';



declare global {
    namespace Express {
        interface Request {
            user: {
                id: string;
                username: string;
                email: string;
                fullName: string;
                workspaceMember?: {
                    userId: string;
                    workspaceId: string;
                    role: USER_ROLE;
                }
            },
            isProjectMember: boolean;
        }
    }
}