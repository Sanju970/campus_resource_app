-- ============================================================
-- DATABASE: campus_portal
-- AUTHOR: Group4 (Phase 3)
-- ============================================================

DROP DATABASE IF EXISTS campus_portal;
CREATE DATABASE campus_portal;
USE campus_portal;

-- ============================================================
-- 1. USER TABLES
-- ============================================================

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name ENUM('student','faculty','admin') NOT NULL UNIQUE
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_uid VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    bio TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expire BIGINT DEFAULT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- ============================================================
-- 2. ORGANIZATION TABLES
-- ============================================================

CREATE TABLE organization_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_key VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(150) NOT NULL
);

CREATE TABLE organizations (
    org_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    hours VARCHAR(255),
    contact VARCHAR(255),
    website VARCHAR(255),
    category_id INT,
    created_by INT NOT NULL,     
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (category_id) REFERENCES organization_categories(category_id)
);

-- ============================================================
-- 3. ORG MEMBERS TABLE with NEW ROLES
-- ============================================================

CREATE TABLE organization_members (
    org_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM(
        'member',
        'coordinator',
        'lead_faculty',
        'event_manager',
        'admin_delegate'
    ) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (org_id, user_id),
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 4. EVENTS 
-- ============================================================

CREATE TABLE events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  location VARCHAR(200),
  capacity INT,
  category_id INT NOT NULL,
  category VARCHAR(100),
  instructor_email VARCHAR(150),
  registration_required BOOLEAN DEFAULT 0,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_by INT NOT NULL,
  approved_by INT DEFAULT NULL,
  org_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  members_only BOOLEAN NOT NULL DEFAULT 0,
  UNIQUE (title, start_datetime, location),
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  FOREIGN KEY (approved_by) REFERENCES users(user_id),
  FOREIGN KEY (category_id) REFERENCES organization_categories(category_id),
  FOREIGN KEY (org_id) REFERENCES organizations(org_id)
);

-- ============================================================
-- 5. EVENT REGISTRATIONS
-- ============================================================

CREATE TABLE event_registrations (
  registration_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 6. ANNOUNCEMENTS
-- ============================================================

CREATE TABLE announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (title, created_by),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- ============================================================
-- 7. FAVORITES
-- ============================================================

CREATE TABLE favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_type ENUM('event','announcement') NOT NULL,
    item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, item_type, item_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

INSERT INTO roles (role_name)
VALUES ('student'), ('faculty'), ('admin');

-- USERS
INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id)
VALUES
('Michael', 'Anderson', 'adm0001', 'adm0001@gmail.com',
 '$2a$10$O3V6.PCv42.rjSKslUt3vO0ktxOTvhaLI.ZYyOpvfoIGgQfKuSUAC', 3),
('Jane', 'Doe', 'fac0006', 'fac0006@gmail.com',
 '$2a$10$0T0VOYrqBqhIlYvT0nRm.OUFwa3.nuDZ8SG/zchbZ9ZsEVll2xpY.', 2),
('John', 'Smith', 'fac0005', 'fac0005@gmail.com',
 '$2a$10$Opi0eknm8c5n3wlgwXzC5utztgQuuenWWxRFxc8As052U9yiHWUfS', 2),
('Emily', 'Lee', 'fac0004', 'fac0004@gmail.com',
 '$2a$10$d1dNmwGVoCaRDZrIoQy29usriQaq0P3FA05A0TxMe0ExKKu/1/cO.', 2),
('Michael', 'Hart', 'fac0003', 'fac0003@gmail.com',
 '$2a$10$1ZaRyvGA9PbpgvfIxeou5O5cfwe1Hig/2md/i3hElWUy4otxGJA.y', 2),
('Robert', 'Steele', 'fac0002', 'fac0002@gmail.com',
 '$2a$10$KPyfTBLXS9lSLDXdKmDrYeVcsqsqt4gqTQ7agqLZdvaChXkg8u4Oe', 2),
('Karen', 'Mitchell', 'fac0001', 'fac0001@gmail.com',
 '$2a$10$jOeOu5nm3qsxZzfTJOJ/YeGoedwZK0alkuU/daw1sFhUwt1bmKsQi', 2),
('Bob', 'Lee', 'stu0001', 'stu0001@gmail.com',
 '$2a$10$ydPYgxkqPJoKT4wzjKYfTuUujMGfN19zqYj5kVa0BC0PjQPSwXNo6', 1);

-- CATEGORIES
INSERT INTO organization_categories (category_key, category_name)
VALUES
('library', 'Library & Study Spaces'),
('academic_support', 'Academic Support'),
('career_services', 'Career Services'),
('health_wellness', 'Health & Wellness'),
('it_services', 'IT Services'),
('activities', 'Activities & Student Life');

-- ORGANIZATIONS
INSERT INTO organizations (title, description, location, hours, contact, website, category_id, created_by)
VALUES
('Central Library', 'Comprehensive research library...', 'Central Building', '7am-11pm',
 'library@campus.edu', 'https://library.campus.edu', 1, 1),
('Writing Center', 'Tutoring for writing...', 'Success Center 201', '9am-8pm',
 'writing@campus.edu', 'https://writing.campus.edu', 2, 1),
('Career Development Center', 'Career counseling...', 'Admin Building 2nd floor', '8:30am-5pm',
 'careers@campus.edu', 'https://careers.campus.edu', 3, 1),
('Health & Wellness Center', 'Health & wellness services...', 'Wellness Center Building', '8am-6pm',
 'wellness@campus.edu', 'https://wellness.campus.edu', 4, 1),
('IT Services', 'Technology support...', 'IT Building 1st floor', '24/7',
 'itsupport@campus.edu', 'https://it.campus.edu', 5, 1),
('Student Activities Office', 'Campus events & clubs...', 'Student Union 210', '9am-5pm',
 'activities@campus.edu', 'https://activities.campus.edu', 6, 1);

-- ORG MEMBERS (CORRECT ROLES ONLY)
INSERT INTO organization_members (org_id, user_id, role)
VALUES
(1, 2, 'lead_faculty'),
(1, 1, 'admin_delegate'),

(2, 3, 'lead_faculty'),
(2, 1, 'admin_delegate'),

(3, 4, 'lead_faculty'),
(3, 1, 'admin_delegate'),

(4, 5, 'lead_faculty'),
(4, 1, 'admin_delegate'),

(5, 6, 'lead_faculty'),
(5, 1, 'admin_delegate'),

(6, 7, 'lead_faculty'),
(6, 1, 'admin_delegate');

-- SAMPLE EVENTS (UPDATED TO MATCH NEW COLUMNS)
-- category_id values:
--  3 = Career Services, 5 = IT Services, 6 = Activities & Student Life
-- org_id values:
--  3 = Career Development Center, 5 = IT Services, 6 = Student Activities Office

INSERT INTO events (
  title,
  description,
  start_datetime,
  end_datetime,
  location,
  capacity,
  category_id,
  category,
  instructor_email,
  registration_required,
  status,
  created_by,
  org_id,
  members_only
)
VALUES
('Career Fair 2025', 'Meet top companies and explore career opportunities.',
 '2025-11-15 10:00:00', '2025-11-15 16:00:00', 'Main Hall, Student Union',
 200, 3, 'Career', NULL, 1, 'approved', 1, 3, 0),

('AI Workshop', 'Hands-on workshop on AI and ML.',
 '2025-11-20 14:00:00', '2025-11-20 17:00:00', 'Lab 101',
 50, 5, 'Workshop', 'fac0001@gmail.com', 1, 'approved', 2, 5, 0),

('Music Concert', 'Enjoy live performances by student bands.',
 '2025-11-25 18:00:00', '2025-11-25 21:00:00', 'Auditorium',
 300, 6, 'Concert', NULL, 0, 'approved', 1, 6, 0);

-- SAMPLE ANNOUNCEMENTS
INSERT INTO announcements (title, content, priority, created_by)
VALUES
('Faculty Meeting Scheduled', 'Mandatory faculty meeting Friday at 3 PM.', 'high', 2),
('Research Grant Applications', 'Apply for new government grants.', 'medium', 2),
('Faculty Development Workshop', 'Training on modern teaching techniques.', 'low', 2);
