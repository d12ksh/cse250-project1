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