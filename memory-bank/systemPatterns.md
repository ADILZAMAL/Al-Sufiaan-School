# System Patterns: Al-Sufiaan School Management System

## Architecture Overview

### System Design
- **Frontend**: React SPA with TypeScript, feature-based organization
- **Backend**: Express.js API with TypeScript, layered architecture
- **Database**: MySQL with Sequelize ORM for data modeling
- **File Storage**: Cloudinary for image/document management
- **Authentication**: JWT tokens with HTTP-only cookies

### Key Architectural Decisions

#### Frontend Architecture
- **Feature-Based Structure**: Organized by business domains (staff, expenses, fees, etc.)
- **Component Hierarchy**: Layout components, feature components, common components
- **State Management**: React Query for server state, React Context for app state
- **Routing**: React Router with nested routes for dashboard sections
- **Styling**: Tailwind CSS for utility-first styling approach

#### Backend Architecture
- **Layered Pattern**: Routes → Controllers → Models → Database
- **Middleware Chain**: CORS → Authentication → Validation → Controllers
- **Error Handling**: Centralized error responses with consistent format
- **File Upload**: Multer middleware with Cloudinary integration
- **Database**: Sequelize models with associations and migrations

## Component Relationships

### Frontend Component Structure
```
App.tsx (Router Provider)
├── Public Routes (Landing, About, Team, Gallery, Contact, Fees)
├── Auth Routes (SignIn)
└── Dashboard (Protected)
    ├── Layout Components (Sidebar, Header)
    ├── Staff Management (Teaching/Non-Teaching)
    ├── Expense Management (Categories, Vendors, Bills)
    ├── Inventory Management (Products, Sales, Transactions)
    ├── Fee Management (Categories, Pricing)
    └── Transportation (Area Pricing)
```

### Backend API Structure
```
Express App
├── Middleware (CORS, Auth, Cookie Parser, JSON Parser)
├── Static File Serving (/uploads)
├── Route Handlers
│   ├── /api/auth (Authentication)
│   ├── /api/schools (School Management)
│   ├── /api/users (User Management)
│   ├── /api/teaching-staff (Teaching Staff CRUD)
│   ├── /api/non-teaching-staff (Non-Teaching Staff CRUD)
│   ├── /api/expenses (Expense Management)
│   ├── /api/vendors (Vendor Management)
│   ├── /api/products (Inventory Management)
│   ├── /api/transactions (Sales Tracking)
│   ├── /api/fee-categories (Fee Management)
│   └── /api/photos (File Upload)
└── Database Models (Sequelize)
```

## Critical Implementation Paths

### Authentication Flow
1. User submits credentials to `/api/auth/login`
2. Backend validates credentials against User model
3. JWT token generated and set as HTTP-only cookie
4. Frontend receives authentication status
5. Protected routes check authentication middleware
6. Token validation on each protected API request

### File Upload Process
1. Frontend form with file input (multipart/form-data)
2. Multer middleware processes file upload
3. File uploaded to Cloudinary via API
4. Cloudinary URL stored in database
5. File served via Cloudinary CDN

### Data Flow Pattern
1. Frontend component triggers API call (React Query)
2. Request passes through middleware chain
3. Controller validates input and calls model methods
4. Sequelize model interacts with MySQL database
5. Response formatted and sent back to frontend
6. React Query updates cache and re-renders components

## Design Patterns in Use

### Frontend Patterns
- **Container/Presentational**: Separation of logic and UI components
- **Custom Hooks**: Reusable logic for API calls and state management
- **Provider Pattern**: Context providers for global state
- **Route Protection**: Higher-order components for authentication
- **Form Handling**: React Hook Form for validation and submission

### Backend Patterns
- **Repository Pattern**: Sequelize models as data access layer
- **Middleware Pattern**: Express middleware for cross-cutting concerns
- **Factory Pattern**: Model associations and relationships
- **Validation Pattern**: Express-validator for input validation
- **Response Pattern**: Consistent API response format

### Database Patterns
- **Active Record**: Sequelize model methods for database operations
- **Association Pattern**: Foreign key relationships between models
- **Migration Pattern**: Database schema versioning
- **Soft Delete**: Maintaining data integrity with deletion flags

## Security Patterns
- **JWT Authentication**: Stateless token-based authentication
- **HTTP-Only Cookies**: Secure token storage
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type and size restrictions
- **Environment Variables**: Sensitive configuration management
