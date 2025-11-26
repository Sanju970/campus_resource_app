# AI Campus Resources Portal -- Phase 3: Backend Development

**Team Members:**
- **Sanjana Tankala** -- 1002230659
- **Sai Sruthi Renati** -- 1002152041
- **Pritesh Sorathia** -- 1002238997
- **Areeb Khan** -- 1001934043
- **Harshini Yallabandi** -- 1002232400
- **Celina Ann Thomas** -- 1002234178

## Hosting & Deployment

**GitHub Repository:**   
https://github.com/Sanju970/campus_resource_app

**Hosted Frontend Link (UTA Cloud):**  
https://sxt0660.uta.cloud/

**Hosted Backend Link (Render):**  
https://campus-resource-app.onrender.com/

**Database Hosting (AWS RDS MySQL):**  
SQL schema: 
```bash
backend/src/models/campus_portal.sql
```

AWS RDS is used as the cloud-hosted MySQL database for the backend.  
The RDS endpoint is private and accessible only to the backend server deployed on Render.  
This ensures security, reliability, and scalable performance.
To run the project locally, developers can use the provided SQL schema.
Import **campus_portal.sql** into any local MySQL instance (MySQL 8+) to recreate the complete database structure and run the backend independently.


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

---

## Features Implemented

### Authentication & User Management
- Login / Register using MySQL  
- Secure password hashing (bcrypt)  
- Automatic role detection  
- JWT-based session persistence  
- Session persists until logout
- Forgot Password + Reset Password  
- Profile settings (update name, bio, etc.)  
- User data management (Admin)  
- Strict backend validation on all inputs  
- Email notifications using Gmail SMTP  
- Logout functionality  

### Organization Management
- Full CRUD for organizations (Admin / Delegates)  
- Join / Leave organizations  
- Organization categories and tagging  
- Organization-level roles (admin_delegate, lead_faculty, coordinator, event_manager, member)  
- Protected routes with RBAC enforcement  
- View detailed org info & member list  

### Events System
- Full CRUD for events  (Admin / Org roles)
- Student event registration & interest  
- Upcoming events widget  
- Event location assignment  
- Attendance viewing  
- Filter / search events  
- Event status tracking on Admin Dashboard  
- Email + in-app notifications for event updates  

### Announcements & Notifications
- Create announcements for orgs or global users  
- Notifications for events, org changes, schedule updates  
- Read/unread support  
- Delete notifications  
- Favorites system for orgs/events/materials  

### Locations & Scheduling
- CRUD for campus locations  
- Validate event-location assignments  
- User weekly schedule (classes/events)  
- Add/remove schedule entries  
- Reminder notifications  

### AI Chat Assistant
- Fully integrated AI chat module  
- `/api/assistant` endpoint  
- Helps with event/org queries, guidance, and general Q&A  

### User Dashboard & Profile
- View and edit profile  
- Manage notifications  
- Manage favorites  
- View joined organizations  
- View registered events  

### Static Pages
- About Us page  
- Contact Us page  

### Admin Dashboard
- User, event, organization statistics  
- Event approval workflow  
- User role management  
- locations management  
- Global content administration  

---

# API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login + JWT |
| GET | `/api/auth/profile` | Get logged-in user |
| POST | `/api/assistant` | AI chatbot response |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/update` | Update profile |
| GET | `/api/users` | Admin list users |
| PATCH | `/api/users/:id/role` | Update user role |
| GET | `/api/organizations` | List organizations |
| POST | `/api/organizations` | Create organization |
| GET | `/api/organizations/:id` | Get organization |
| PUT | `/api/organizations/:id` | Update organization |
| DELETE | `/api/organizations/:id` | Delete organization |
| POST | `/api/organizations/:id/join` | Join organization |
| POST | `/api/organizations/:id/leave` | Leave organization |
| GET | `/api/organizations/:id/members` | List members |
| PATCH | `/api/organizations/:id/members/:userId/role` | Update org role |
| GET | `/api/org-categories` | Get categories |
| GET | `/api/events` | All events |
| POST | `/api/events` | Create event |
| GET | `/api/events/:id` | Single event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| PATCH | `/api/events/:id/approve` | Approve event |
| POST | `/api/event_registrations/:eventId` | Register |
| GET | `/api/event_registrations/:eventId` | Attendees |
| DELETE | `/api/event_registrations/:eventId/cancel` | Cancel |
| GET | `/api/announcements` | All announcements |
| POST | `/api/announcements` | Create |
| GET | `/api/announcements/:orgId` | Org announcements |
| DELETE | `/api/announcements/:id` | Delete |
| GET | `/api/favorites` | User favorites |
| POST | `/api/favorites/add` | Add favorite |
| DELETE | `/api/favorites/remove/:itemId` | Remove favorite |
| GET | `/api/notifications` | All notifications |
| PATCH | `/api/notifications/:id/read` | Mark read |
| DELETE | `/api/notifications/:id` | Delete |
| GET | `/api/locations` | All locations |
| POST | `/api/locations` | Add location |
| PUT | `/api/locations/:id` | Update |
| DELETE | `/api/locations/:id` | Delete |
| GET | `/api/schedule` | User schedule |
| POST | `/api/schedule` | Add schedule entry |
| DELETE | `/api/schedule/:id` | Remove schedule |
| GET | `/api/faculty` | List faculty |
| POST | `/api/faculty` | Add faculty |
| DELETE | `/api/faculty/:id` | Delete faculty |
| GET | `/api/dashboard/stats` | User/org/event stats |
| GET | `/api/dashboard/events/status` | Event status breakdown |
| GET | `/api/dashboard/users/activity` | User activity logs |

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

|Category|Technology|
|---|----|
|Backend Framework| Node.js + Express.js|
|Database|  MySQL2 (Promise)|
|Authentication| JWT + bcrypt|
|Email Service|Nodemailer (Gmail SMTP)|
| Frontend Hosting|UTA Cloud|
|API Format|REST JSON|

------------------------------------------------------------------------

## Environment Requirements

    Node.js 18.x or higher  
    MySQL 8.x  
    npm 9.x or higher

------------------------------------------------------------------------

## Installation & Setup Guide

``` bash
# Clone the repository
git clone https://github.com/Sanju970/campus_resource_app

# Navigate into the backend folder
cd campus_resource_app/backend/

# Install backend dependencies
npm install

# Start the backend server (development mode)
npm run dev

```

### Configure using example `.env`:

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

### Existing users:

| Role|user_id| Email| Password|
|-|-|-|-|
| **Student**|stu0001|[stu0001@gmail.com](mailto:stu0001@gmail.com)|Student@123 |
| **Faculty**|fac0001|[fac0001@gmail.com](mailto:fac0001@gmail.com)|Faculty@123 |
| **Admin**|adm0001|[adm0001@gmail.com](mailto:adm0001@gmail.com)|Admin@123|


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
------------------------------------------------------------------------
## License

This backend is developed for **UTA Web Data Management -- Phase 3**.

------------------------------------------------------------------------


