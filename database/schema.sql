-- Tell IntelliJ which database to use
USE contact_db;

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     first_name VARCHAR(50) NOT NULL,
                                     last_name VARCHAR(50) NOT NULL,
                                     email VARCHAR(100) NOT NULL,
                                     phone VARCHAR(20),
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
                                           id INT AUTO_INCREMENT PRIMARY KEY,
                                           name VARCHAR(50) NOT NULL
);

-- 3. Create Message Status Table
CREATE TABLE IF NOT EXISTS message_status (
                                              id INT AUTO_INCREMENT PRIMARY KEY,
                                              status_name VARCHAR(20) NOT NULL
);

-- 4. Create Messages Table (This links everything together)
CREATE TABLE IF NOT EXISTS messages (
                                        id INT AUTO_INCREMENT PRIMARY KEY,
                                        user_id INT,
                                        department_id INT,
                                        status_id INT,
                                        subject VARCHAR(255),
                                        message TEXT,
                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
                                        CONSTRAINT fk_dept FOREIGN KEY (department_id) REFERENCES departments(id),
                                        CONSTRAINT fk_status FOREIGN KEY (status_id) REFERENCES message_status(id)
);

-- 5. Add Initial Values (Seed Data)
INSERT INTO departments (name) VALUES
                                   ('Customer Support'),
                                   ('Sales'),
                                   ('Technical Support'),
                                   ('General Inquiry');

INSERT INTO message_status (status_name) VALUES
                                             ('New'),
                                             ('Read'),
                                             ('Replied'),
                                             ('Closed');