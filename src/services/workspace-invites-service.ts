import { config } from "@/config/env";
import { User } from "@/models/user-model";
import { WorkspaceInvite } from "@/models/workspace-invites-model";
import { WorkspaceMember } from "@/models/workspace-member";
import { Workspace } from "@/models/workspace-model";
import { AcceptInviteInput, WorkspaceInviteInput } from "@/schemas/workspace-invite";
import { INVITE_STATUS, IWorkspace, WorkspaceInviteContext } from "@/types/workspace";
import { ApiError } from "@/utils/api-error";
import { sendInviteEmail } from "@/utils/email/email-actions";
import { canManageWorkspace } from "@/utils/permissions";
import { withTransaction } from "@/utils/with-transaction";
import crypto from "crypto";


class WorkspaceInvitesService {
    async sendInvite(ctx: WorkspaceInviteContext, { email, role }: WorkspaceInviteInput) {
        const targetUser = await User.exists({ email, accountStatus: 'active' })
        if (!targetUser) {
            throw new ApiError(404, 'The user you are trying to invite no longer exist');
        };

        // only owner can send invite for his workspace
        const workspace = await Workspace.findOne({ _id: ctx.workspaceId }).select('name ownerId').lean<Pick<IWorkspace, 'name' | 'ownerId'>>().exec();
        if (!workspace) {
            throw new ApiError(403, "Workspace not found or No longer accessible");
        };

        if (!canManageWorkspace(ctx.userId, workspace.ownerId.toString())) {
            throw new ApiError(403, 'Forbidden: You are not authorized to send invites for this workspace');
        }

        if (ctx.userId === targetUser._id.toString()) {
            throw new ApiError(400, 'You cannot invite yourself to this workspace');
        };

        const existingInvite = await WorkspaceInvite.exists({
            workspaceId: ctx.workspaceId,
            email,
            tokenExpiresAt: { $gt: Date.now() }
        }).lean().exec()

        if (existingInvite) {
            throw new ApiError(400, 'An active invite has already been sent to this email for the specified workspace');
        };

        const isAlreadyMember = await WorkspaceMember.exists({
            workspaceId: ctx.workspaceId,
            userId: targetUser._id
        }).lean().exec()

        if (isAlreadyMember) {
            throw new ApiError(400, 'The user you are trying to invite is already a member of this workspace');
        }



        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

        const invite = await WorkspaceInvite.create({
            workspaceId: ctx.workspaceId,
            invitedBy: ctx.userId,
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
                inviterName: ctx.fullName
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

    async acceptInvite(ctx: WorkspaceInviteContext, { token }: AcceptInviteInput) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        await withTransaction(async (session) => {

            const invite = await WorkspaceInvite.findOneAndUpdate({
                token: hashedToken,
                status: 'pending',
                tokenExpiresAt: { $gt: Date.now() }
            }, {
                $set: {
                    tokenExpiresAt: null,
                    token: null,
                    status: 'accepted'
                }
            }, { new: true, session }).lean().exec();

            if (!invite) {
                throw new ApiError(400, 'Invalid, expired, or already used invitation.');
            };

            // 2. SECURITY: Verify email matches the invite
            if (ctx.email !== invite.email) {
                // Note: This throws inside transaction, triggering a ROLLBACK 
                // of the 'accepted' status update above. Safe!
                throw new ApiError(403, 'This invite was issued to a different email address.');
            };

            // 3. IDEMPOTENCY: Check if already a member
            const existingMember = await WorkspaceMember.exists({
                userId: ctx.userId,
                workspaceId: invite.workspaceId
            }).session(session);

            if (existingMember) {
                throw new ApiError(400, 'You are already a member of this workspace.');
            }

            await WorkspaceMember.create([{
                userId: ctx.userId,
                workspaceId: invite.workspaceId,
                role: invite.role,
                joinedAt: new Date(),
            }], { session });

            await Workspace.updateOne(
                { _id: invite.workspaceId }, {
                $inc: { membersCount: 1 }
            }, { session }).exec();

            return {
                status: 200,
                message: 'You have successfully joined the workspace',
                data: null
            }
        })
    }

    async getWorkspaceInvites(ctx: WorkspaceInviteContext, query: { status?: INVITE_STATUS, limit?: string, page?: string }) {
        const workspace = await Workspace.findOne({ _id: ctx.workspaceId }).select('_id name ownerId').lean().exec();
        if (!workspace) {
            throw new ApiError(404, 'Workspace not found');
        };

        if (!canManageWorkspace(ctx.userId, workspace.ownerId.toString())) {
            throw new ApiError(403, 'Forbidden: You are not authorized to view invites for this workspace');
        }

        const limit = query.limit ? parseInt(query.limit, 10) : +config.DEFAULT_RESPONSE_LIMIT;
        const page = query.page ? parseInt(query.page, 10) : 1;
        const skip = (page - 1) * limit;
        const apiQuery: any = { workspaceId: ctx.workspaceId };
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
                total, page, limit,
                invites,
            }
        }
    }

    async getGlobalInvites(ctx: WorkspaceInviteContext, query: { limit?: string, page?: string }) {
        const limit = query.limit ? parseInt(query.limit, 10) : +config.DEFAULT_RESPONSE_LIMIT;
        const page = query.page ? parseInt(query.page, 10) : 1;
        const skip = (page - 1) * limit;

        const apiQuery: any = { email: ctx.email, status: 'pending' };
        const invites = await WorkspaceInvite.find(apiQuery).select('_id role invitedBy email status createdAt').populate({
            path: 'invitedBy',
            select: 'fullName email username _id profilePhoto'
        }).limit(limit).skip(skip).lean().exec();

        const message = invites.length === 0 ? 'You have no invites' : 'Your invites retrieved successfully';
        return {
            status: 200,
            message,
            data: {
                total: invites.length,
                page,
                limit,
                invites,
            }
        }
    }
}

export const workspaceInvitesService = new WorkspaceInvitesService();
