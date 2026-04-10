const canvas = document.getElementById("bg-animation");
const ctx = canvas.getContext("2d");

function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let particles = [];

for(let i=0;i<80;i++){
    particles.push({
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        size:Math.random()*3+1,
        speedX:(Math.random()-.5)*0.5,
        speedY:(Math.random()-.5)*0.5
    });
}

function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    particles.forEach(p=>{
        p.x+=p.speedX;
        p.y+=p.speedY;

        if(p.x<0||p.x>canvas.width) p.speedX*=-1;
        if(p.y<0||p.y>canvas.height) p.speedY*=-1;

        ctx.beginPath();
        ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle="rgba(255,255,255,0.5)";
        ctx.fill();
    });

    requestAnimationFrame(animate);
}

animate();

// ========== FORM SUBMISSION ==========

document.getElementById("contact-form").addEventListener("submit", async function(e){

    e.preventDefault();

    // Get form values
    const formData = {
        firstName: document.querySelector("input[placeholder='First Name']").value,
        lastName: document.querySelector("input[placeholder='Last Name']").value,
        email: document.querySelector("input[placeholder='Email Address']").value,
        phone: document.querySelector("input[placeholder='Phone Number']").value,
        department: document.querySelector("select").value,
        subject: document.querySelector("input[placeholder='Subject']").value,
        message: document.querySelector("textarea").value
    };

    // Validation
    if (!formData.firstName.trim()) {
        alert("First Name is required");
        return;
    }
    if (!formData.lastName.trim()) {
        alert("Last Name is required");
        return;
    }
    if (!formData.email.includes("@")) {
        alert("Valid Email is required");
        return;
    }
    if (!formData.subject.trim()) {
        alert("Subject is required");
        return;
    }
    if (!formData.message.trim()) {
        alert("Message is required");
        return;
    }

    try {
        // CHANGE THIS URL TO YOUR DEPLOYED BACKEND
        const response = await fetch("https://xyz-contactus.onrender.com/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            alert("✓ Message sent successfully! We'll get back to you soon.");

            // Reset form
            document.getElementById("contact-form").reset();
        } else {
            alert("❌ Error: " + result.message);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error sending message. Please try again.");
    }

});