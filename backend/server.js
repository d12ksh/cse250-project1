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
                from: "XYZ Technologies <onboarding@resend.dev>",
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
            to: process.env.EMAIL_USER,
            subject: "📥 New Contact Request",
            html: `
            <div style="font-family: Arial; padding:20px;">
                <h2>New Contact Submission</h2>
                <p><b>Name:</b> ${firstName} ${lastName}</p>
                <p><b>Email:</b> ${email}</p>
                <p><b>Phone:</b> ${phone}</p>
                <p><b>Department:</b> ${department}</p>
                <p><b>Subject:</b> ${subject}</p>
                <p><b>Message:</b><br/>${message}</p>
            </div>
            `,
        };

        // 📩 USER EMAIL
        const userMail = {
            to: email,
            subject: "We've received your message",
            html: `
            <div style="font-family: Arial; padding:20px;">
                <h2>Hi ${firstName},</h2>
                <p>We received your message and will get back to you soon.</p>
                <p><b>Subject:</b> ${subject}</p>
                <p><b>Message:</b><br/>${message}</p>
                <br/>
                <p>— XYZ Technologies</p>
            </div>
            `,
        };

        // ✅ SEND EMAILS
        await transporter.sendMail(adminMail);
        await transporter.sendMail(userMail);

        console.log("✅ Emails sent");

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

// ✅ START SERVER
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});