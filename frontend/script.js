const form = document.getElementById("contactForm");
const responseMessage = document.getElementById("responseMessage");

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    const data = {
        name,
        email,
        message
    };

    // TEMP: log instead of sending (backend may not be ready)
    console.log("Form data:", data);

    responseMessage.textContent = "Message sent (frontend test).";
});
