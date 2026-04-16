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

// ✅ Nodemailer transporter (Resend API)
const transporter = nodemailer.createTransport({
    name: "resend",
    send: async (mail, callback) => {
        try {
            let { to, subject, html } = mail.data;

            if (Array.isArray(to)) {
                to = to[0];
            }

            const response = await resend.emails.send({
                from: "Contact Team <onboarding@resend.dev>",
                to,
                subject,
                html,
            });

            console.log("📩 Email sent →", to);

            callback(null, response);
        } catch (error) {
            console.error("❌ Email error:", error);
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

        // 1️⃣ USER CHECK / CREATE
        let userResult = await conn.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        let userId;
        if (userResult.length > 0) {
            userId = userResult[0].id;
        } else {
            let insertUser = await conn.query(
                "INSERT INTO users (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)",
                [firstName, lastName, email, phone]
            );
            userId = insertUser.insertId;
        }

        // 2️⃣ DEPARTMENT
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

        // 3️⃣ INSERT MESSAGE
        await conn.query(
            "INSERT INTO messages (user_id, department_id, status_id, subject, message) VALUES (?, ?, 1, ?, ?)",
            [userId, departmentId, subject, message]
        );

        // 📩 ADMIN EMAIL
        const adminMail = {
            from: "XYZ Technologies <onboarding@resend.dev>",
            to: process.env.EMAIL_USER,
            subject: "📥 New Contact Request",
            html: `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden;">

            <div style="background:linear-gradient(90deg,#4f46e5,#7c3aed); color:white; padding:20px;">
                <h2 style="margin:0;">📩 New Contact Submission</h2>
                <p style="margin:0; font-size:14px;">XYZ Technologies</p>
            </div>

            <div style="padding:25px;">
                <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Department:</strong> ${department}</p>

                <hr style="margin:20px 0;"/>

                <p><strong>Subject:</strong> ${subject}</p>

                <div style="background:#f9fafb; padding:15px; border-radius:8px;">
                    ${message}
                </div>
            </div>

            <div style="background:#f1f1f1; padding:10px; text-align:center; font-size:12px;">
                Internal Notification • XYZ Technologies
            </div>

        </div>
    </div>
    `,
        };

// 📩 USER EMAIL (UPGRADED UI)
        const userMail = {
            from: "XYZ Technologies <onboarding@resend.dev>",
            to: email,
            subject: "📩 We've received your message!",
            html: `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden;">
            
            <!-- HEADER -->
            <div style="background:linear-gradient(90deg,#4f46e5,#7c3aed); color:white; padding:25px; text-align:center;">
                <h1 style="margin:0;">XYZ Technologies</h1>
                <p style="margin:0; font-size:14px;">We’ve received your message</p>
            </div>

            <!-- BODY -->
            <div style="padding:25px;">
                <h2>Hi ${firstName} 👋</h2>

                <p>Thanks for reaching out to us. Our team has received your message and will get back to you shortly.</p>

                <div style="margin-top:20px; padding:15px; background:#f9fafb; border-radius:8px;">
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                </div>

                <p style="margin-top:20px;">If this wasn’t you, you can safely ignore this email.</p>

                <p style="margin-top:30px;">— Team XYZ</p>
            </div>

            <!-- FOOTER -->
            <div style="background:#f1f1f1; padding:12px; text-align:center; font-size:12px;">
                © 2026 XYZ Technologies • All rights reserved
            </div>

        </div>
    </div>
    `,
        };

// ✅ SEND EMAILS
        try {
            await transporter.sendMail(adminMail);
            console.log("✅ Admin email sent");
        } catch (err) {
            console.error("❌ Admin email failed:", err);
        }

        try {
            await transporter.sendMail(userMail);
            console.log("✅ User email sent");
        } catch (err) {
            console.error("❌ User email failed:", err);
        }

// ✅ RESPONSE
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
app.get("/messages", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                m.id,
                u.first_name,
                u.email,
                d.name AS department,
                m.subject,
                m.message,
                s.status_name,
                m.created_at
            FROM messages m
            JOIN users u ON m.user_id = u.id
            JOIN departments d ON m.department_id = d.id
            JOIN message_status s ON m.status_id = s.id
            ORDER BY m.created_at DESC
        `);

        res.json(result);
    } catch (err) {
        console.error("❌ Fetch error:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});
// ✅ START SERVER
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});