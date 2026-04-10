require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // your gmail
        pass: process.env.EMAIL_PASS, // app password
    },
});

// test route
app.get("/", (req, res) => {
    res.send("Backend server running");
});

// ✅ contact route (UPDATED)
app.post("/contact", async (req, res) => {
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

        console.log("Form received:", req.body);

        // 📩 email to admin
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

        // 📬 email to user
        const userMail = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "We received your message",
            text: `
Hi ${firstName},

Thanks for contacting us regarding "${subject}".

We’ll get back to you soon.

Your message:
${message}
      `,
        };

        // 🚀 send both emails
        await Promise.all([
            transporter.sendMail(adminMail),
            transporter.sendMail(userMail),
        ]);

        res.json({
            status: "success",
            message: "Message sent successfully",
        });

    } catch (error) {
        console.error("Email error:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to send email",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// vansh version
/* 
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// EMAIL SETUP
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your-email@gmail.com",
        pass: "your-app-password"
    }
});

// CONTACT ROUTE
app.post("/contact", async (req, res) => {

    const { firstName, lastName, email, phone, department, subject, message } = req.body;

    let conn;

    try {
        conn = await pool.getConnection();

        // 1. Check if user exists
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

        // 2. Get department_id
        let deptResult = await conn.query(
            "SELECT id FROM departments WHERE name = ?",
            [department]
        );

        if (deptResult.length === 0) {
            return res.status(400).json({ message: "Invalid department" });
        }

        let departmentId = deptResult[0].id;

        // 3. Insert message
        await conn.query(
            "INSERT INTO messages (user_id, department_id, subject, message) VALUES (?, ?, ?, ?)",
            [userId, departmentId, subject, message]
        );

        // 4. Send email to admin
        await transporter.sendMail({
            from: email,
            to: "your-email@gmail.com",
            subject: `New Message: ${subject}`,
            text: `Name: ${firstName} ${lastName}\nEmail: ${email}\n\n${message}`
        });

        // 5. Confirmation email to user
        await transporter.sendMail({
            from: "your-email@gmail.com",
            to: email,
            subject: "We received your message",
            text: `Hi ${firstName}, we will get back to you soon.`
        });

        res.json({ message: "Message sent successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    } finally {
        if (conn) conn.release();
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
*/