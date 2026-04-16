-- ================================
-- CONTACT DATABASE SETUP
-- ================================

CREATE DATABASE contact_db;
USE contact_db;


-- Stores people submitting the form

CREATE TABLE users (
                       id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                       first_name VARCHAR(50) NOT NULL,
                       last_name VARCHAR(50) NOT NULL,
                       email VARCHAR(100) UNIQUE NOT NULL,
                       phone VARCHAR(15),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Small fixed set → use TINYINT

CREATE TABLE departments (
                             id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                             name VARCHAR(50) UNIQUE NOT NULL
);

-- Limited values → TINYINT

CREATE TABLE message_status (
                                id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                status_name VARCHAR(20) UNIQUE NOT NULL
);

-- Main table storing messages

CREATE TABLE messages (
                          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                          user_id INT UNSIGNED NOT NULL,
                          department_id TINYINT UNSIGNED NOT NULL,
                          status_id TINYINT UNSIGNED DEFAULT 1,
                          subject VARCHAR(150) NOT NULL,
                          message TEXT NOT NULL,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                          FOREIGN KEY (user_id) REFERENCES users(id),
                          FOREIGN KEY (department_id) REFERENCES departments(id),
                          FOREIGN KEY (status_id) REFERENCES message_status(id)
);


-- Departments
INSERT INTO departments (name) VALUES
                                   ('Sales'),
                                   ('Support'),
                                   ('Technical'),
                                   ('General');

-- Message Status
INSERT INTO message_status (status_name) VALUES
                                             ('new'),
                                             ('in_progress'),
                                             ('resolved');

-- INDEXES (Performance Optimization)


CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_department ON messages(department_id);
CREATE INDEX idx_messages_status ON messages(status_id);
CREATE INDEX idx_messages_created ON messages(created_at);