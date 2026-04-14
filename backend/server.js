require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ✅ Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Nodemailer transporter using Resend (NO SMTP)
const transporter = nodemailer.createTransport({
    name: "resend",
    send: async (mail, callback) => {
        try {
            const { to, subject, text } = mail.data;

            const response = await resend.emails.send({
                from: "onboarding@resend.dev", // REQUIRED
                to,
                subject,
                text,
            });

            callback(null, response);
        } catch (error) {
            console.error("Email error:", error);
            callback(error);
        }
    },
});

// ✅ TEST ROUTE
app.get("/", (req, res) => {
    res.send("Backend server running");
});

// ✅ CONTACT ROUTE
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

        // 4️⃣ EMAIL TO ADMIN
        const adminMail = {
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

        // 5️⃣ EMAIL TO USER
        const userMail = {
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

        // ✅ NON-BLOCKING EMAIL (IMPORTANT)
        Promise.all([
            transporter.sendMail(adminMail),
            transporter.sendMail(userMail),
        ]).catch((err) => console.error("Email error:", err));

        console.log("✓ Emails triggered");

        // ✅ SEND RESPONSE IMMEDIATELY
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

// ✅ START SERVER
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});