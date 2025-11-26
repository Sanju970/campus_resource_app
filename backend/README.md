# AI Campus Resources Portal -- Phase 3: Backend Development

**Team Members:**
- **Sanjana Tankala** -- 1002230659
- **Sai Sruthi Renati** -- 1002152041
- **Pritesh Sorathia** -- 1002238997
- **Areeb Khan** -- 1001934043
- **Harshini Yallabandi** -- 1002232400
- **Celina Ann Thomas** -- 1002234178

**Hosted Backend Link (UTA Cloud):**\
https://sxt0660.uta.cloud/

**GitHub Repository:**\
https://github.com/Sanju970/campus_resource_app

------------------------------------------------------------------------

## Project Overview

The **AI Campus Resources Portal Backend** powers all server-side logic
for authentication, organizations, events, announcements, scheduling,
notifications, favorites, and admin dashboards.

This backend was developed for **Phase 3 -- Full-Stack Dynamic Website**
using:

-   **Node.js + Express.js**
-   **MySQL2 (Promise API)**
-   **JWT authentication**
-   **SMTP (Nodemailer) email integration**
-   **Role-based authorization (Student, Faculty, Admin + Org Roles)**

It provides secure REST APIs used by the React frontend to build a fully
dynamic campus portal.

------------------------------------------------------------------------

## Features Implemented

### Authentication & User Management

-   Login / Register using MySQL database
-   Secure password hashing (bcrypt)
-   Automatic role detection (no radio buttons)
-   JWT-based session management
-   "Session persists until logout" functionality
-   Email notifications using Gmail SMTP
-   Strict input validation

### Organization Management

-   CRUD for organizations (Admin / Delegates)
-   Organization categories
-   Join/Leave organizations
-   Role enforcement for all protected routes

### Events System

-   Create / Approve / Update events
-   Event registration
-   Schedule and upcoming events
-   Dashboard statistics

### Announcements & Notifications

-   Create announcements
-   User notifications
-   Favorites system

### Locations & Scheduling

-   CRUD for campus locations
-   Schedule management routes

### Admin Dashboard

-   User metrics
-   Event/Org statistics
-   Profile management

------------------------------------------------------------------------

## API Architecture

  -----------------------------------------------------------------------
  Module                            Routes
  --------------------------------- -------------------------------------
  Authentication                    `/api/auth/login`,
                                    `/api/auth/register`,
                                    `/api/auth/profile`

  Users                             `/api/users/:id`, `/api/users/update`

  Organizations                     `/api/organizations/*`

  Events                            `/api/events/*`

  Event Registrations               `/api/event_registrations/*`

  Announcements                     `/api/announcements/*`

  Favorites                         `/api/favorites/*`

  Notifications                     `/api/notifications/*`

  Locations                         `/api/locations/*`

  Dashboard                         `/api/dashboard/*`
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Backend File Structure
```
   campus_portal_app/
   │── backend/
   │   │── src/
   │   │   ├── config/
   │   │   │    ├── db.js
   │   │   │    └── sendEmail.js
   │   │   ├── routes/
   │   │   │    ├── auth.js
   │   │   │    ├── assistant.js
   │   │   │    ├── users.js
   │   │   │    ├── announcements.js
   │   │   │    ├── events.js
   │   │   │    ├── favorites.js
   │   │   │    ├── notifications.js
   │   │   │    ├── event_registrations.js
   │   │   │    ├── organizations.js
   │   │   │    ├── scheduleRoutes.js
   │   │   │    ├── orgCategories.js
   │   │   │    ├── faculty.js
   │   │   │    ├── location.js
   │   │   │    └── dashboard.js
   │   │   │
   │   │   └── index.js    # Main server entry
   │   │
   │   ├── package.json
   │   └── README.md
   └── frontend/ # Phase2
```
------------------------------------------------------------------------

## Tech Stack

  Category            Technology
  ------------------- -------------------------
  Backend Framework   Node.js + Express.js
  Database            MySQL2 (Promise)
  Authentication      JWT + bcrypt
  Email Service       Nodemailer (Gmail SMTP)
  Hosting             UTA Cloud
  API Format          REST JSON

------------------------------------------------------------------------

## Environment Requirements

    Node.js 18.x or higher  
    MySQL 8.x  
    npm 9.x or higher

------------------------------------------------------------------------

## Installation & Setup Guide

    git clone https://github.com/Sanju970/campus_resource_app
    cd campus_resource_app/backend/
    npm install

### Configure `.env`:

    DB_HOST=localhost
    DB_USER=root
    DB_PASS=yourpassword
    DB_NAME=campus_portal
    JWT_SECRET=supersecretjwtkey
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your-email@gmail.com
    SMTP_PASS=your-app-password
    SMTP_FROM="Campus Portal <your-email@gmail.com>"
    FRONTEND_URL=http://localhost:3000

### Start Server

    npm start

------------------------------------------------------------------------

## Deployment on UTA Cloud

1.  Upload backend files\
2.  Install Node.js\
3.  Ensure DB access\
4.  Run: `node server.js`\
5.  Connect with frontend hosted at: https://sxt0660.uta.cloud/

------------------------------------------------------------------------

## License

This backend is developed for **UTA Web Data Management -- Phase 3**.

------------------------------------------------------------------------

## References

1. Official Node.js Documentation – https://nodejs.org
2. Express.js Guide – https://expressjs.com
3. JWT (jsonwebtoken) Documentation – https://www.npmjs.com/package/jsonwebtoken
4. Nodemailer SMTP Documentation – https://nodemailer.com/smtp/
5. React & Vite Documentation – https://react.dev
6. Render Backend Hosting – https://render.com
7. ChatGPT – used only for bug-fix guidance & explanation
8. Google Gemini – used for AI assistance
