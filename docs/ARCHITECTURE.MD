# System Architecture

## Overview
Sync-UP is a **Multi-tenant, role-based project/task management system** with Express.js and MongoDB.

## Core Responsibilities

- **User Management**: Registeration, authentication/authorization.
- **Workspace Management**: Multi-tenant workspaces with fully isolated data.
- **Project Management**: Projects within the workspace with member access control.
- **Task Management**: Tasks management within the projects with assignments and status tracking.
- **Collaboration**: Workspace invites, member management, task assignment.
- **Security**: JWT based authentication, role-based access control, rate-limiting, security headers.

