import { User } from "@/models/user-model";
import { WorkspaceInvite } from "@/models/workspace-invites-model";
import { WorkspaceMember } from "@/models/workspace-member";
import { Workspace } from "@/models/workspace-model";
import { AcceptInviteInput, WorkspaceInviteInput } from "@/schemas/workspace-invite";
import { ApiError } from "@/utils/api-error";
import { sendInviteEmail } from "@/utils/email/email-actions";
import crypto from "crypto";



class WorkspaceInvitesService {

    // Off course workspace owner will be the one sending the invite. so he'll in req after authentication. and controller will pass that.
    async sendInvite(workspaceOwner: { id: string, username: string, email: string, fullName: string }, { email, role, workspaceId }: WorkspaceInviteInput) {
        const targetUser = await User.findOne({ email, accountStatus: 'active' }).select('_id').lean().exec();
        if (!targetUser) {
            throw new ApiError(404, 'The user you are trying to invite no longer exist');
        };

        const workspace = await Workspace.findOne({ _id: workspaceId, ownerId: workspaceOwner.id }).select('_id name').lean().exec();
        if (!workspace) {
            throw new ApiError(404, 'The workspace you are trying to invite for, no longer exist');
        };

        if (workspaceOwner.id === targetUser._id.toString()) {
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
            invitedBy: workspaceOwner.id,
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
                inviterName: workspaceOwner.fullName
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

    async acceptInvite(userId: string, userEmail: string, { token, workspaceId }: AcceptInviteInput) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const invite = await WorkspaceInvite.findOne({
            workspaceId,
            token: hashedToken,
            tokenExpiresAt: { $gt: Date.now() }
        });

        if (!invite) {
            throw new ApiError(400, 'Invalid or expired invite token');
        };

        if (userEmail !== invite.email) {
            throw new ApiError(400, 'This invite is not for your email address');
        }
        //TODO: transaction here
        const newMember = await WorkspaceMember.create({
            userId: userId,
            workspaceId,
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

    async getInvitesForWorkspace(_workspaceId: string) { }

    async revokeInvite(_inviteId: string) { }

    async cleanUpExpiredInvites() { }

    async getInvitesForUser(_userId: string) { }

}

export const workspaceInvitesService = new WorkspaceInvitesService();
