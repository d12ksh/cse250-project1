const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Backend server running");
});

app.post("/contact", (req, res) => {

    const data = req.body;

    console.log("Form received:", data);

    res.json({
        status: "success",
        message: "Message received"
    });

});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});