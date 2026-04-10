-- Create contact_db database
CREATE DATABASE IF NOT EXISTS contact_db;
USE contact_db;

-- Users table (stores contact form submitters)
CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Departments table (Sales, Support, Technical, General)
CREATE TABLE IF NOT EXISTS departments (
                                           id INT AUTO_INCREMENT PRIMARY KEY,
                                           name VARCHAR(100) UNIQUE NOT NULL
    );

-- Message Status table (new, in_progress, resolved)
CREATE TABLE IF NOT EXISTS message_status (
                                              id INT AUTO_INCREMENT PRIMARY KEY,
                                              status_name VARCHAR(50) UNIQUE NOT NULL
    );

-- Messages table (stores contact form submissions)
CREATE TABLE IF NOT EXISTS messages (
                                        id INT AUTO_INCREMENT PRIMARY KEY,
                                        user_id INT NOT NULL,
                                        department_id INT NOT NULL,
                                        status_id INT NOT NULL DEFAULT 1,
                                        subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (status_id) REFERENCES message_status(id)
    );

-- Insert default departments
INSERT IGNORE INTO departments (name) VALUES ('Sales');
INSERT IGNORE INTO departments (name) VALUES ('Support');
INSERT IGNORE INTO departments (name) VALUES ('Technical');
INSERT IGNORE INTO departments (name) VALUES ('General');

-- Insert default message statuses
INSERT IGNORE INTO message_status (id, status_name) VALUES (1, 'new');
INSERT IGNORE INTO message_status (id, status_name) VALUES (2, 'in_progress');
INSERT IGNORE INTO message_status (id, status_name) VALUES (3, 'resolved');

-- Create indexes for better query performance
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_user_id ON messages(user_id);
CREATE INDEX idx_department_id ON messages(department_id);
CREATE INDEX idx_status_id ON messages(status_id);
CREATE INDEX idx_created_at ON messages(created_at);