const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
    res.send("Backend server running");
});

// contact route
app.post("/contact", (req, res) => {

    const data = req.body;

    console.log("Form received:", data);

    res.json({
        status: "success",
        message: "Message received"
    });

});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});