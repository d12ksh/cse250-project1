require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Email Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Test route
app.get("/", (req, res) => {
    res.send("Backend server running");
});

// ✅ CONTACT ROUTE - FULL INTEGRATION
app.post("/contact", async (req, res) => {
    let conn;
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            department,
            subject,
            message,
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !subject || !message) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields",
            });
        }

        console.log("Form received:", req.body);

        conn = await pool.getConnection();

        // 1️⃣ CHECK/CREATE USER
        let userResult = await conn.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        let userId;
        if (userResult.length > 0) {
            userId = userResult[0].id;
            console.log("✓ User exists:", userId);
        } else {
            let insertUser = await conn.query(
                "INSERT INTO users (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)",
                [firstName, lastName, email, phone]
            );
            userId = insertUser.insertId;
            console.log("✓ New user created:", userId);
        }

        // 2️⃣ GET DEPARTMENT ID
        let deptResult = await conn.query(
            "SELECT id FROM departments WHERE name = ?",
            [department]
        );

        if (deptResult.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Invalid department",
            });
        }

        let departmentId = deptResult[0].id;
        console.log("✓ Department mapped:", department, "→", departmentId);

        // 3️⃣ INSERT MESSAGE
        let messageResult = await conn.query(
            "INSERT INTO messages (user_id, department_id, status_id, subject, message) VALUES (?, ?, 1, ?, ?)",
            [userId, departmentId, subject, message]
        );
        console.log("✓ Message inserted:", messageResult.insertId);

        // 4️⃣ SEND EMAIL TO ADMIN
        const adminMail = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `New Contact: ${subject}`,
            text: `
Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone}
Department: ${department}

Message:
${message}
            `,
        };

        // 5️⃣ SEND EMAIL TO USER
        const userMail = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "We received your message",
            text: `
Hi ${firstName},

Thanks for contacting us regarding "${subject}".

We'll get back to you soon.

Best regards,
The Team
            `,
        };

        await Promise.all([
            transporter.sendMail(adminMail),
            transporter.sendMail(userMail),
        ]);

        console.log("✓ Emails sent to admin and user");

        res.json({
            status: "success",
            message: "Message sent successfully",
        });

    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to send message",
        });
    } finally {
        if (conn) conn.release();
    }
});

// GET ALL MESSAGES (Admin Dashboard)
app.get("/messages", async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();

        const messages = await conn.query(`
            SELECT 
                m.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                d.name AS department,
                ms.status_name,
                m.subject,
                m.message,
                m.created_at
            FROM messages m
            JOIN users u ON m.user_id = u.id
            JOIN departments d ON m.department_id = d.id
            JOIN message_status ms ON m.status_id = ms.id
            ORDER BY m.created_at DESC
        `);

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    } finally {
        if (conn) conn.release();
    }
});

// GET SINGLE MESSAGE
app.get("/messages/:id", async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();

        const messages = await conn.query(`
            SELECT 
                m.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                d.name AS department,
                ms.status_name,
                m.subject,
                m.message,
                m.created_at
            FROM messages m
            JOIN users u ON m.user_id = u.id
            JOIN departments d ON m.department_id = d.id
            JOIN message_status ms ON m.status_id = ms.id
            WHERE m.id = ?
        `, [req.params.id]);

        if (messages.length === 0) {
            return res.status(404).json({ error: "Message not found" });
        }

        res.json(messages[0]);
    } catch (error) {
        console.error("Error fetching message:", error);
        res.status(500).json({ error: "Failed to fetch message" });
    } finally {
        if (conn) conn.release();
    }
});

// UPDATE MESSAGE STATUS
app.put("/messages/:id/status", async (req, res) => {
    let conn;
    try {
        const { statusId } = req.body;

        if (!statusId) {
            return res.status(400).json({ error: "Status ID required" });
        }

        conn = await pool.getConnection();

        await conn.query(
            "UPDATE messages SET status_id = ? WHERE id = ?",
            [statusId, req.params.id]
        );

        res.json({ status: "success", message: "Status updated" });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ error: "Failed to update status" });
    } finally {
        if (conn) conn.release();
    }
});

// GET DEPARTMENTS
app.get("/departments", async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const departments = await conn.query("SELECT id, name FROM departments");
        res.json(departments);
    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({ error: "Failed to fetch departments" });
    } finally {
        if (conn) conn.release();
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});