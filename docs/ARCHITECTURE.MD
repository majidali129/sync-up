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

## Architecture Layers

### Three Layer Architecture
```
Image goes here
```


### Layer Responsibilities

#### Routes Layer

- **File**: `src/routes/`
- **Responsibility**: URL mapping, middleware chaining, request validation
- **Key Files**:
  - `index.ts` - Main router setup
  - `auth-routes.ts` - Authentication endpoints
  - `workspace-routes.ts` - Workspace endpoints
  - `project-routes.ts` - Project endpoints
  - `task-routes.ts` - Task endpoints
  - `workspace-invites-routes.ts` - Workspace invites

```

#### Controllers Layer

- **File**: `src/controllers/`
- **Responsibility**: HTTP request/response handling, middleware orchestration
- **Pattern**: Each controller handles one domain
  - `auth-controller.ts` - Authentication logic
  - `workspace-controller.ts` - Workspace operations
  - `project-controller.ts` - Project operations
  - `task-controller.ts` - Task operations

  #### Services Layer

- **File**: `src/services/`
- **Responsibility**: Business logic, data validation, transaction management
- **Pattern**: Services are domain-specific and stateless
  - `auth-service.ts` - User authentication & management
  - `workspace-service.ts` - Workspace CRUD & member management
  - `project-service.ts` - Project CRUD & member management
  - `task-service.ts` - Task CRUD & assignment logic

  #### Models Layer

- **File**: `src/models/`
- **Responsibility**: Mongoose schema definition and database queries
- **Database Collections**:
  - `users` - User accounts
  - `workspaces` - Workspace containers
  - `workspace-members` - Workspace membership records
  - `projects` - Projects within workspaces
  - `tasks` - Tasks within projects
  - `workspace-invites` - Pending workspace invitations
  - `audit-logs` - Action audit trail

```

## System Layers

- Authentication (JWT - access/refresh tokens)
- Authorization (4-layer middleware)
- Business Logic (workspace → project → task hierarchy)
- Data Access (MongoDB with workspace isolation)

## Authorization Strategy

### Layer 1: Authentication Check
- Validates JWT access token
- Returns 401 if invalid

### Layer 2: Workspace Membership
- Checks user belongs to workspace
- Returns 403 if not member

### Layer 3: Role-Based Access
- Owner: Full workspace control
- Admin: Project-level control (own projects only)
- Member: Read-only + assigned tasks

### Layer 4: Resource Ownership
- Service-level checks for creator/assignee
- Enforced in workspace/project/task services

## Multi-Tenancy Design
- Workspace-level isolation
- Every query scoped by workspace
- Prevents cross-workspace data leakage

## Key Design Decisions
- **Why JWT refresh tokens in DB?** Token revocation capability
- **Why middleware layers?** Separation of concerns, reusable checks
- **Why workspace scoping in every collection?** Data isolation guarantee
- **Why NoSQL over SQL?** Due to mongoDB's flexible schema nature.

## Error Handling

### Error Handling Architecture

```
┌──────────────────────────────────┐
│  Route Handler (async)           │
└────────┬─────────────────────────┘
         │ throws error
         │
         ▼
┌──────────────────────────────────┐
│  Caught by async-handler wrapper │
│  (try-catch wrapper)             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Error type check:               │
│  - Is ApiError?                  │
│  - Is validation error?          │
│  - Is unexpected error?          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Format error response           │
│  - HTTP status code              │
│  - Error message                 │
│  - Field errors (if validation)  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Send JSON error response        │
└──────────────────────────────────┘
```


### Error Classes

**ApiError** (Custom Error):

```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
  }
}
```

**Usage**:

```typescript
throw new ApiError(404, "Workspace not found");
throw new ApiError(403, "Not authorized");
throw new ApiError(400, "Validation failed", [
  { field: "email", message: "Invalid format" }
]);
```

### Async Handler Wrapper

**File**: `src/utils/async-handler.ts`

```typescript
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

**Usage**:

```typescript
router.post('/projects', 
  asyncHandler(async (req, res) => {
    // No need for try-catch
    // Errors automatically passed to error middleware
    const result = await projectService.create(...);
    res.json(result);
  })
);
```

### Error Response Formats

**Client Error (4xx)**:

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

**Server Error (5xx)**:

```json
{
  "status": 500,
  "message": "Internal server error"
}
```

### Global Error Handling Middleware
```
export const globalErrorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.NODE_ENV.trim() === 'development') {
        sendDevError(res, err)
    } else if (config.NODE_ENV === 'production') {
        console.log('PROD ERROR 💥', err);
        let error = { ...err, message: err.message, name: err.name };

        if (err instanceof ZodError) {
            error = handleValidationError(err)
        }
        // mongoose duplicate key error
        if (err.code === 11000) {
            error = handleDuplicateFieldError(err);
        }

        sendProdError(res, error)
    };
}

```