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
            const { to, subject, html } = mail.data;

            const response = await resend.emails.send({
                from: "NEW QUERY (ADMIN REQUEST) <onboarding@resend.dev>",
                to,
                subject,
                html,
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

        // 1️⃣ USER CHECK
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

        // 3️⃣ MESSAGE INSERT
        await conn.query(
            "INSERT INTO messages (user_id, department_id, status_id, subject, message) VALUES (?, ?, 1, ?, ?)",
            [userId, departmentId, subject, message]
        );

        // 🎯 FIX: Send admin mail ALSO to user (guaranteed delivery)
        const adminMail = {
            to: process.env.EMAIL_USER || email,
            subject: `📥 New Contact Request`,
            html: `
            <div style="font-family: Arial; background:#f4f6f8; padding:20px;">
                <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:10px;">
                    
                    <h2 style="color:#4f46e5;">New Contact Submission</h2>

                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Department:</strong> ${department}</p>

                    <hr/>

                    <p><strong>Message:</strong></p>
                    <p style="background:#f9fafb; padding:10px; border-radius:5px;">
                        ${message}
                    </p>

                </div>
            </div>
            `,
        };

        const userMail = {
            to: email,
            subject: "📩 We've received your message!",
            html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
                <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
                    
                    <div style="background: #4f46e5; color: white; padding: 20px; text-align: center;">
                        <h1>Contact Support</h1>
                    </div>

                    <div style="padding: 25px;">
                        <h2>Hi ${firstName} 👋</h2>

                        <p>We've received your request regarding:</p>

                        <div style="background:#f9fafb; padding:15px; border-radius:8px;">
                            <strong>${subject}</strong>
                        </div>

                        <p>Our team will respond shortly.</p>

                        <br/>

                        <p>— Support Team</p>
                    </div>

                    <div style="background:#f1f1f1; padding:10px; text-align:center; font-size:12px;">
                        This is an automated message.
                    </div>
                </div>
            </div>
            `,
        };

        // ✅ NON-BLOCKING EMAIL
        Promise.all([
            transporter.sendMail(adminMail),
            transporter.sendMail(userMail),
        ]).catch((err) => console.error("Email error:", err));

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