# Dealer Management System - Unified TypeScript Service

This is a unified TypeScript-based service that combines both the backend API and React frontend into a single project. It replaces the previous FastAPI (Python) backend with an Express.js (Node.js) backend while maintaining the same functionality.

## Features

- **Unified Codebase**: Single TypeScript project containing both backend and frontend
- **Express.js Backend**: RESTful API built with Express.js and TypeScript
- **React Frontend**: Modern React application with TypeScript and Tailwind CSS
- **Database Support**: PostgreSQL (primary) and SQLite (fallback) support
- **Type Safety**: Full TypeScript support for both backend and frontend
- **Modern Tooling**: Vite for frontend development, ES modules, and modern Node.js features

## Project Structure

```
dealer_management_unified_service/
├── src/
│   ├── server/           # Backend Express.js code
│   │   ├── config/       # Configuration files
│   │   ├── models/       # TypeScript interfaces
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic layer
│   │   └── index.ts      # Main server file
│   └── client/           # React frontend code
│       ├── components/   # React components
│       ├── pages/        # Page components
│       ├── contexts/     # React contexts
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utility libraries
│       └── types/        # TypeScript type definitions
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tsconfig.server.json  # Server-specific TypeScript config
├── vite.config.ts        # Vite configuration
└── README.md            # This file
```

## Prerequisites

- Node.js 18+ 
- npm or pnpm
- PostgreSQL (optional, can use SQLite)

## Installation

1. **Clone and navigate to the project**:
   ```bash
   cd dealer_management_unified_service
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**:
   - **PostgreSQL**: Update `DATABASE_URL` in your `.env` file
   - **SQLite**: Set `USE_SQLITE=true` in your `.env` file

## Development

### Running the Development Server

The development setup runs both the backend and frontend simultaneously:

```bash
npm run dev
```

This will start:
- **Backend**: Express.js server on port 8080
- **Frontend**: React dev server on port 3000

### Running Individual Services

**Backend only**:
```bash
npm run dev:server
```

**Frontend only**:
```bash
npm run dev:client
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Production Build

1. **Build both backend and frontend**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

The production build serves the React frontend from the Express.js server, eliminating the need for a separate frontend server.

## API Endpoints

### Contracts

- `POST /api/contract/new` - Create a new contract
- `GET /api/contracts` - Get all contracts (with pagination)
- `GET /api/contract/:id` - Get contract by ID
- `PUT /api/contract/:id` - Update contract
- `DELETE /api/contract/:id` - Delete contract
- `GET /api/contracts/search` - Search contracts

### Health Check

- `GET /health` - Service health status
- `GET /` - API information

## Database Models

The system includes the following data models:

- **User**: System users with authentication
- **Vehicle**: Vehicle inventory with VIN numbers
- **Customer**: Customer information
- **Contract**: Rental/lease contracts
- **ContractImage**: Contract-related documents and images

## Migration from FastAPI

This unified service replaces the previous FastAPI backend with equivalent functionality:

| FastAPI Feature | Express.js Equivalent |
|----------------|----------------------|
| Pydantic models | Zod schemas + TypeScript interfaces |
| SQLAlchemy ORM | Raw SQL queries with pg/sqlite3 |
| FastAPI routers | Express.js routers |
| Dependency injection | Service classes |
| Automatic validation | Manual validation with Zod |
| OpenAPI docs | Manual API documentation |

## Configuration

### Environment Variables

- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `USE_SQLITE`: Enable SQLite fallback
- `CORS_ORIGINS`: Allowed CORS origins

### Database Configuration

The system supports both PostgreSQL and SQLite:

- **PostgreSQL**: Primary database for production use
- **SQLite**: Lightweight fallback for development/testing

## Development Workflow

1. **Backend Changes**: Edit files in `src/server/`
2. **Frontend Changes**: Edit files in `src/client/`
3. **API Integration**: Frontend communicates with backend via `/api` endpoints
4. **Hot Reload**: Both services support hot reloading during development

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 8080 and 3000 are available
2. **Database connection**: Check database credentials and connection strings
3. **TypeScript errors**: Run `npm run type-check` to identify issues
4. **Build errors**: Ensure all dependencies are installed

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## Contributing

1. Follow TypeScript best practices
2. Maintain type safety across the stack
3. Use Zod for input validation
4. Follow the existing code structure
5. Test both backend and frontend functionality

## License

This project is licensed under the ISC License.
# Updated Mon Sep  1 14:52:08 PDT 2025
