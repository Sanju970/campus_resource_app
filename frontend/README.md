# AI Campus Resources Portal – Phase 2: Front-End Development

**Team Members:**  
- **Sanjana Tankala** – 1002230659
- **Sai Sruthi Renati** – 1002152041
- **Pritesh Sorathia** – 1002238997
- **Areeb Khan** – 1001934043
- **Harshini Yallabandi** – 1002232400
- **Celina Ann Thomas** – 1002234178

**Hosted Link:**  
[https://sxt0660.uta.cloud/](https://sxt0660.uta.cloud/)

**GitHub Repository:**
[https://github.com/Sanju970/ai_campus_portal_frontend](https://github.com/Sanju970/ai_campus_portal_frontend)

---

## Project Overview
The **AI Campus Resources Portal** is a modern React web app that provides students, faculty, and administrators with access to campus materials, events, announcements, and an integrated AI assistant.  
It was developed for **Phase 2 – Front-End Development** using **Vite + React 18**, **Tailwind CSS**, and **shadcn/ui** components.

---

## Features Implemented

### Authentication
- Role-based login/signup (Student / Faculty / Admin).  
- Password strength meter and confirmation validation.  
- Persistent “Remember Me” option with localStorage.

### Navigation & Layout
- Centralized navigation handled through `Layout.jsx`.  
- Profile dropdown provides quick links to **Profile**, **Notifications**, **Favorites**, and **User Data (Admin-only)**.  
- Dynamic rendering of components based on current page and role.

### Pages Included
| Page | Description |
|------|--------------|
| LoginPage.jsx | Handles secure login and signup with validation. |
| HomePage.jsx | Main dashboard after authentication. |
| EventsPage.jsx | Displays upcoming campus events. |
| AnnouncementsPage.jsx | Lists announcements and notices. |
| MaterialsPage.jsx | Repository of learning materials. |
| ResourcesPage.jsx | Resource cards with categorized links. |
| SchedulePage.jsx | Weekly class or event schedule. |
| ProfilePage.jsx | View and edit user information. |
| NotificationsPage.jsx | View alerts and messages. |
| FavoritesPage.jsx | Manage bookmarked resources. |
| AIChat.jsx | Integrated AI chatbot for quick help. |
| AdminPage.jsx | Allows admins to manage users, roles, and access data. |
| Layout.jsx | Centralized layout component managing navigation, header, and theme. |
| ResourcesCard.jsx | Reusable card component used to display individual resource items. |
---

## UI & Design
- Built entirely with **Tailwind CSS v4**.  
- Uses **Radix UI + shadcn/ui** components for accessibility and consistency.  
- Icon set from **Lucide React**.  
- Responsive design tested on mobile, tablet, and desktop.  
- Dark-mode ready through `next-themes`.

---

## Technical Stack

| Category | Technology |
|-----------|-------------|
| Framework | React 18.3.1 + Vite 6.3.5 |
| Language | JavaScript (JSX) |
| Styling | Tailwind CSS |
| UI Library | shadcn/ui & Radix UI |
| Icons | Lucide React |
| Notifications | Sonner v2.0.3 |
| Hosting | UTA Cloud |
| Build Tool | Vite + SWC plugin for React |

---

## AI Integration
- **AIChat.jsx** embeds an intelligent assistant for campus queries.  
- Design optimization and accessibility improvements guided by AI suggestions during development.

---

## Accessibility & Testing
- ARIA labels and roles included for screen-reader support.  
- Keyboard navigation and focus states verified.  
- Cross-browser compatibility confirmed on:  
  - Chrome  
  - Firefox  
  - Edge  
  - Safari  

---
## Environment Requirements (Required)

```bash
Node.js 20.x or higher
npm 9.x or higher
```
Older Node versions (like 10, 12, or 14) will cause build failures because Vite, React Router 7, and SWC require modern ES Modules.

## Installation & Setup Guide

```bash
# Clone the Repository
git clone https://github.com/Sanju970/ai_campus_portal_frontend.git

# Navigate to the Project Directory
cd ai_campus_portal_frontend

# Clean old installations
rm -rf node_modules package-lock.json

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build optimized production files
npm run build
```

---
## Demo Login Credentials
You can use the following test accounts to explore different roles in the portal:
| Role| Email| Password|
|-|-|-|
| **Student**|[student@gmail.com](mailto:student@gmail.com)|student123 |
| **Faculty**|[faculty@gmail.com](mailto:faculty@gmail.com)|faculty123 |
| **Admin**|[admin@gmail.com](mailto:admin@gmail.com)|admin123|


## Deployment on UTA Cloud
1. Run `npm run build` to generate the `build/ or dist/` folder.  
2. Uploaded contents of `build/ or dist/` (e.g., `index.html`, `assets/`) to UTA Cloud `public_html` directory.  
3. Access the app at [https://sxt0660.uta.cloud](https://sxt0660.uta.cloud).  
4. File structure looks like:
   ```
   public_html/
     ├── assets/
     ├── index.html
     └── ...
   ```

---
## External References

* [shadcn/ui](https://ui.shadcn.com) used under MIT License
* [Radix UI](https://www.radix-ui.com) for accessible React components
* [Figma](https://www.figma.com) used for UI design reference
* [Lucide Icons](https://lucide.dev) for icon assets
* [Unsplash](https://unsplash.com) for freely licensed images
---
## License / Acknowledgment
This project is developed for **UTA Front-End Development Phase 2** coursework.  
All open-source packages follow their respective MIT licenses.
