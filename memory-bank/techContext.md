# Technical Context: Al-Sufiaan School Management System

## Technology Stack

### Frontend Technologies
- **React 18.2.0**: Modern React with hooks and functional components
- **TypeScript 5.2.2**: Type safety and enhanced developer experience
- **Vite 5.1.6**: Fast build tool and development server
- **React Router DOM 6.22.3**: Client-side routing with nested routes
- **React Query 3.39.3**: Server state management and caching
- **React Hook Form 7.51.2**: Form handling with validation
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **React Icons 5.5.0**: Icon library for UI components
- **Recharts 3.1.0**: Chart library for data visualization

### Backend Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js 4.19.0**: Web application framework
- **TypeScript 5.4.3**: Type safety for backend development
- **Sequelize 6.37.1**: ORM for database operations
- **MySQL2 3.9.2**: MySQL database driver
- **JWT (jsonwebtoken 9.0.2)**: Authentication token management
- **bcryptjs 2.4.3**: Password hashing and verification
- **Multer 2.0.2**: File upload middleware
- **Cloudinary 2.7.0**: Cloud-based image and video management

### Development Tools
- **nodemon 3.1.0**: Development server auto-restart
- **ts-node 10.9.2**: TypeScript execution for Node.js
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing and optimization

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL database server
- Cloudinary account for file storage
- Git for version control

### Environment Configuration
- **Backend**: `.env` file with database credentials, JWT secrets, Cloudinary config
- **Frontend**: Environment variables for API endpoints
- **CORS**: Configured for development (localhost:5173) and production domains

### Database Setup
- MySQL database with Sequelize ORM
- Model associations and relationships defined
- Migration scripts for schema management
- Seed data for initial setup

### File Structure
```
Al-Sufiaan-School/
├── backend/
│   ├── src/
│   │   ├── config/ (database, cloudinary)
│   │   ├── controllers/ (business logic)
│   │   ├── middleware/ (auth, upload)
│   │   ├── models/ (database models)
│   │   ├── routes/ (API endpoints)
│   │   ├── types/ (TypeScript definitions)
│   │   └── utils/ (helper functions)
│   ├── uploads/ (local file storage)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/ (API client)
│   │   ├── components/ (reusable components)
│   │   ├── features/ (feature-specific components)
│   │   ├── hooks/ (custom React hooks)
│   │   ├── lib/ (utilities and constants)
│   │   └── providers/ (context providers)
│   ├── public/ (static assets)
│   └── package.json
└── memory-bank/ (project documentation)
```

## Technical Constraints

### Performance Requirements
- Fast page load times (< 3 seconds)
- Responsive UI interactions
- Efficient database queries
- Optimized image loading via Cloudinary

### Security Requirements
- Secure authentication with JWT
- Input validation and sanitization
- CORS protection
- File upload restrictions
- Environment variable protection

### Scalability Considerations
- Modular component architecture
- Efficient database indexing
- CDN for static assets
- Caching strategies with React Query

## Integration Points

### External Services
- **Cloudinary**: Image upload and management
- **MySQL Database**: Data persistence
- **JWT**: Authentication and authorization

### API Design
- RESTful API endpoints
- Consistent response format
- Error handling and status codes
- Request/response validation

### Development Workflow
- **Frontend**: `npm run dev` (Vite development server on port 5173)
- **Backend**: `npm run dev` (nodemon on port 7000)
- **Database**: Local MySQL or cloud instance
- **File Uploads**: Cloudinary integration for production

## Tool Usage Patterns

### Frontend Development
- Component-based architecture with TypeScript
- React Query for API state management
- Tailwind for responsive styling
- React Hook Form for form validation
- React Router for navigation

### Backend Development
- Express middleware pattern
- Sequelize ORM for database operations
- JWT authentication middleware
- Multer for file upload handling
- Environment-based configuration

### Database Management
- Sequelize models with TypeScript
- Association definitions between models
- Migration scripts for schema changes
- Validation at model level

## Deployment Considerations
- **Frontend**: Static build deployment (Vite build)
- **Backend**: Node.js server deployment
- **Database**: MySQL database hosting
- **File Storage**: Cloudinary CDN
- **Environment**: Production environment variables
- **CORS**: Production domain configuration
