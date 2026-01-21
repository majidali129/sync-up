import { User } from '../src/models/user-model'
// import { Workspace } from '../src/models/workspace-model'
// import { WorkspaceMember } from '../src/models/workspace-member'
// import { WorkspaceInvite } from '../src/models/workspace-invites-model'
import { Project } from '../src/models/project-model'
import { connectDB } from '../src/db/connect-db'
import { httpServer } from '../src/server'
import dotenv from 'dotenv'
import fs from 'fs';
import { config } from '../src/config/env'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt'

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const users = JSON.parse(fs.readFileSync(`${_dirname}/users.json`, 'utf-8'))
// const workspaces = JSON.parse(fs.readFileSync(`${_dirname}/workspaces.json`, 'utf-8'))
// const workspaceMembers = JSON.parse(fs.readFileSync(`${_dirname}/workspace-members.json`, 'utf-8'));
// const invitedWorkspaceMembers = JSON.parse(fs.readFileSync(`${_dirname}/invited-workspace-members.json`, 'utf-8'));
// const workspaceInvites = JSON.parse(fs.readFileSync(`${_dirname}/workspace-invites.json`, 'utf-8'));
const projects = JSON.parse(fs.readFileSync(`${_dirname}/projects.json`, 'utf-8'));


dotenv.config()




connectDB().then(() => {
    httpServer.on('error', (err) => {
        console.error('Server error:', err);
        throw err;
    });

    httpServer.listen(config.PORT || 8000, () => {
        console.log(`Server is listening on port ${config.PORT || 8000}`);
    })
}).catch(err => {
    console.error('MongoDB Connection Failed:', err);
});


const importData = async () => {
    try {
        // await User.create(users, { validateBeforeSave: false });
        // await Workspace.create(workspaces, { validateBeforeSave: false });
        // await WorkspaceMember.create(workspaceMembers, { validateBeforeSave: false });
        // await WorkspaceInvite.create(workspaceInvites, { validateBeforeSave: false });
        // await WorkspaceMember.create(invitedWorkspaceMembers, { validateBeforeSave: false });
        // await Project.create(projects, { validateBeforeSave: false });
        process.exit(0);
    } catch (error) {
        console.error('Data Import Failed:', error);
        process.exit(1);
    }
}

// const getUserIds = async () => {
//     const allUsers = await User.find({}, '_id email').lean().exec();
//     return allUsers;
// }

const hashPasswords = async () => {
    try {
        const allUsers = await User.find({}).select('password').exec();
        for (const user of allUsers) {
            // user.password = await User.hashPassword(user.password);
            user.password = await bcrypt.hash(user.password, 12);
            await user.save({ validateBeforeSave: false });
        }
    } catch (error) {
        console.error('Password Hashing Failed:', error);
        process.exit(1);
    }
}

const deleteData = async () => {
    try {
        // await User.deleteMany({});
        // await Workspace.deleteMany({});
        // await WorkspaceMember.deleteMany({});
        // await WorkspaceInvite.deleteMany({});
        // await Project.deleteMany({});
    } catch (error) {
        console.error('Data Deletion Failed:', error);
        process.exit(1);
    }
}

if (process.argv[2] === '--import') {
    console.log('Data Import Started...');
    // await importData();
    // const userIds = await getUserIds();
    // console.log(userIds);
    // await hashPasswords();
    // console.log('Data Imported Successfully');
    console.log('Password Hashing Completed');
} else if (process.argv[2] === '--delete') {
    await deleteData();
    console.log('Data Deleted Successfully');
}