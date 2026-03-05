const form = document.getElementById("contact-form");

form.addEventListener("submit",function(e){

    e.preventDefault();

    alert("Message sent!");

    form.reset();

});