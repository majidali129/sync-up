import { config } from "@/config/env";
import { User } from "@/models/user-model";
import { WorkspaceInvite } from "@/models/workspace-invites-model";
import { WorkspaceMember } from "@/models/workspace-member";
import { Workspace } from "@/models/workspace-model";
import { AcceptInviteInput, WorkspaceInviteInput } from "@/schemas/workspace-invite";
import { INVITE_STATUS } from "@/types/workspace";
import { ApiError } from "@/utils/api-error";
import { sendInviteEmail } from "@/utils/email/email-actions";
import crypto from "crypto";



class WorkspaceInvitesService {

    // Off course workspace owner will be the one sending the invite. so he'll in req after authentication. and controller will pass that.
    async sendInvite(owner: { id: string, username: string, email: string, fullName: string }, workspaceId: string, { email, role }: WorkspaceInviteInput) {
        const targetUser = await User.findOne({ email, accountStatus: 'active' }).select('_id').lean().exec();
        if (!targetUser) {
            throw new ApiError(404, 'The user you are trying to invite no longer exist');
        };

        const workspace = await Workspace.findOne({ _id: workspaceId, ownerId: owner.id }).select('_id name').lean().exec();
        if (!workspace) {
            throw new ApiError(404, 'The workspace you are trying to invite for, no longer exist');
        };

        if (owner.id === targetUser._id.toString()) {
            throw new ApiError(400, 'You cannot invite yourself to this workspace');
        };

        const existingInvite = await WorkspaceInvite.findOne({
            workspaceId,
            email,
            tokenExpiresAt: { $gt: Date.now() }
        });

        if (existingInvite) {
            throw new ApiError(400, 'An active invite has already been sent to this email for the specified workspace');
        };

        const isAlreadyMember = await WorkspaceMember.findOne({
            workspaceId,
            userId: targetUser._id
        }).lean().exec();

        if (isAlreadyMember) {
            throw new ApiError(400, 'The user you are trying to invite is already a member of this workspace');
        }



        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

        const invite = await WorkspaceInvite.create({
            workspaceId,
            invitedBy: owner.id,
            role,
            email,
            token: hashedToken,
            tokenExpiresAt,
        });

        if (!invite) {
            throw new ApiError(500, 'Failed to create workspace invite. Please try again later.');
        };


        try {
            await sendInviteEmail({
                email,
                token,
                workspaceName: workspace.name,
                inviterName: owner.fullName
            })
        } catch (error) {
            await WorkspaceInvite.findByIdAndDelete(invite._id).exec();
            throw new ApiError(500, 'Failed to send invite email. Please try again later.');
        }

        return {
            status: 201,
            message: 'Invite sent successfully',
            data: {
                inviteId: invite._id,
            }
        }

    }

    async acceptInvite(userId: string, userEmail: string, { token }: AcceptInviteInput) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const invite = await WorkspaceInvite.findOne({
            token: hashedToken,
            tokenExpiresAt: { $gt: Date.now() }
        });

        if (!invite) {
            throw new ApiError(400, 'Invalid or expired invite token');
        };

        if (invite.status === 'accepted') {
            throw new ApiError(400, 'This invite has already been accepted');
        }

        if (userEmail !== invite.email) {
            throw new ApiError(400, 'This invite is not for your email address');
        }
        //TODO: transaction here
        const newMember = await WorkspaceMember.create({
            userId,
            workspaceId: invite.workspaceId,
            role: invite.role,
            joinedAt: new Date(),
        });

        if (!newMember) {
            throw new ApiError(500, 'Failed to add you to the workspace. Please try again later.');
        }

        invite.tokenExpiresAt = null;
        invite.token = null;
        invite.status = 'accepted';

        await invite.save({ validateBeforeSave: false });

        return {
            status: 200,
            message: 'You have successfully joined the workspace',
            data: null
        }
    }

    async getWorkspaceInvites(workspaceId: string, userId: string, query: { status?: INVITE_STATUS, limit?: string, page?: string }) {
        const workspace = await Workspace.findOne({ _id: workspaceId, ownerId: userId }).select('_id').lean().exec();
        if (!workspace) {
            throw new ApiError(404, 'Workspace not found or you are not authorized to view its invites');
        }
        const limit = query.limit ? parseInt(query.limit, 10) : +config.DEFAULT_RESPONSE_LIMIT;
        const page = query.page ? parseInt(query.page, 10) : 1;
        const skip = (page - 1) * limit;
        const apiQuery: any = { workspaceId };
        if (query.status) {
            apiQuery.status = query.status;
        }
        const [invites, total] = await Promise.all([
            WorkspaceInvite.find(apiQuery).limit(limit).skip(skip).lean().exec(),
            WorkspaceInvite.countDocuments(apiQuery).exec()
        ]);
        return {
            status: 200,
            message: 'Workspace invites retrieved successfully',
            data: {
                invites, total, page, limit
            }
        }
    }

    async getGlobalInvites(userEmail: string) {
        const apiQuery: any = { email: userEmail, status: 'accepted' };
        const invites = await WorkspaceInvite.find(apiQuery).lean().exec();

        const message = invites.length === 0 ? 'You have no pending invites' : 'Your pending invites retrieved successfully';
        return {
            status: 200,
            message,
            data: invites
        }
    }
}

export const workspaceInvitesService = new WorkspaceInvitesService();
