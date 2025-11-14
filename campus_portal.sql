-- ============================================================
-- DATABASE: campus_portal
-- AUTHOR: Group4 (Phase 3)
-- ============================================================

-- Drop and recreate database fresh
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
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================================
-- 2. EVENTS
-- ============================================================

CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    location VARCHAR(200),
    capacity INT,
    category VARCHAR(100),
    instructor_email VARCHAR(150),
    registration_required BOOLEAN DEFAULT FALSE,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_by INT NOT NULL,
    approved_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- prevent redundant/duplicate event entries
    CONSTRAINT unique_event UNIQUE (title, start_datetime, location),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================
-- 3. ANNOUNCEMENTS
-- ============================================================

CREATE TABLE announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_announcement UNIQUE (title, created_by),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 4. FAVORITES
-- ============================================================

CREATE TABLE favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_type ENUM('event','announcement','resource') NOT NULL,
    item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_favorite UNIQUE (user_id, item_type, item_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 6. EVENT REGISTRATIONS
-- ============================================================

CREATE TABLE event_registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 7. SAMPLE DATA
-- ============================================================

INSERT INTO roles (role_name) VALUES ('student'), ('faculty'), ('admin');

-- ------------------------------------------------------
-- SAMPLE USERS
-- ------------------------------------------------------

INSERT INTO users (first_name, last_name, user_uid, email, password_hash, role_id)
VALUES
('System', 'Admin', 'adm0001', 'adm0001@campus.edu',
 '$2a$10$O3V6.PCv42.rjSKslUt3vO0ktxOTvhaLI.ZYyOpvfoIGgQfKuSUAC', 3), 

('Alice', 'Faculty', 'fac0006', 'fac0006@campus.edu',
 '$2a$10$0T0VOYrqBqhIlYvT0nRm.OUFwa3.nuDZ8SG/zchbZ9ZsEVll2xpY.', 2),

('Alice', 'Faculty', 'fac0005', 'fac0005@campus.edu',
 '$2a$10$Opi0eknm8c5n3wlgwXzC5utztgQuuenWWxRFxc8As052U9yiHWUfS', 2), 

('Alice', 'Faculty', 'fac0004', 'fac0004@campus.edu',
 '$2a$10$d1dNmwGVoCaRDZrIoQy29usriQaq0P3FA05A0TxMe0ExKKu/1/cO.', 2),

('Alice', 'Faculty', 'fac0003', 'fac0003@campus.edu',
 '$2a$10$1ZaRyvGA9PbpgvfIxeou5O5cfwe1Hig/2md/i3hElWUy4otxGJA.y', 2),

('Alice', 'Faculty', 'fac0002', 'fac0002@campus.edu',
 '$2a$10$KPyfTBLXS9lSLDXdKmDrYeVcsqsqt4gqTQ7agqLZdvaChXkg8u4Oe', 2),

('Alice', 'Faculty', 'fac0001', 'fac0001@campus.edu',
 '$2a$10$jOeOu5nm3qsxZzfTJOJ/YeGoedwZK0alkuU/daw1sFhUwt1bmKsQi', 2),

('Bob', 'Student', 'stu0001', 'stu0001@campus.edu',
 '$2a$10$ydPYgxkqPJoKT4wzjKYfTuUujMGfN19zqYj5kVa0BC0PjQPSwXNo6', 1);


-- Sample Events (duplicates prevented by unique constraint)
INSERT INTO events (title, description, start_datetime, end_datetime, location, capacity, category, instructor_email, registration_required, status, created_by)
VALUES 
('Career Fair 2025', 'Meet top companies and explore career opportunities.', 
 '2025-11-15 10:00:00', '2025-11-15 16:00:00', 'Main Hall, Student Union', 200, 'Career', NULL, 1, 'approved', 1),
('AI Workshop', 'Hands-on workshop on AI and Machine Learning.', 
 '2025-11-20 14:00:00', '2025-11-20 17:00:00', 'Lab 101', 50, 'Workshop', 'prof.ai@university.edu', 1, 'approved', 2),
('Music Concert', 'Enjoy live performances by student bands.', 
 '2025-11-25 18:00:00', '2025-11-25 21:00:00', 'Auditorium', 300, 'Concert', NULL, 0, 'approved', 1),
('Guest Lecture: Quantum Computing', 'Lecture by Dr. Quantum on future computing trends.', 
 '2025-12-01 11:00:00', '2025-12-01 12:30:00', 'Lecture Hall 3', 100, 'Lecture', 'dr.quantum@university.edu', 1, 'approved', 2),
('Sports Meet', 'Annual inter-college sports event.', 
 '2025-12-05 09:00:00', '2025-12-05 17:00:00', 'Sports Ground', 500, 'Sports', NULL, 0, 'approved', 1);

-- Sample Announcements
INSERT INTO announcements (title, content, priority, created_by)
VALUES 
('Library Hours Extended', 'The library will now be open until 10 PM on weekdays.', 'medium', 1),
('Campus Maintenance', 'The main campus parking lot will be closed for maintenance.', 'high', 1),
('Guest Lecture on AI', 'Join us for a guest lecture on Artificial Intelligence by Dr. Smith.', 'urgent', 1),
('Cafeteria Menu Update', 'New vegetarian options available from next week.', 'low', 1);

-- ============================================================
-- END OF SCRIPT
-- ============================================================
