# Campus Portal - Backend Starter (Node.js + Express + MySQL)

## What is included
- Express server with routes for auth, events, announcements, favorites, and notifications
- MySQL integration using `mysql2` (raw queries)
- JWT authentication and role-based middleware
- SQL initialization script to create the database and tables
- `.env` support for configuration

## Quick start
1. Copy `.env.example` to `.env` (or edit the provided `.env`) and fill in your MySQL credentials and JWT secret.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database (run the SQL in `src/models/init.sql` using MySQL Workbench or CLI):
   ```sql
   -- run src/models/init.sql
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
5. API base: `http://localhost:5000/api/`

## Notes
- Passwords are hashed with bcryptjs.
- Students creating events will create them with `status = 'pending'`; faculty/admin creations are automatically `approved`.
- This is a starter project — extend controllers, validation, and error handling as needed.
