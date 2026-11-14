
// SIGN UP FORM

const signupForm = document.getElementById("signup-form");

signupForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("full-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const message = document.getElementById("signup-message");

    if (name === "" || email === "" || password === "" || confirmPassword === "") {
        message.textContent = "Please fill in every field.";
        return;
    }

    if (password.length < 8) {
        message.textContent = "Your password must have at least 8 characters.";
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = "Your passwords don't match. Try again.";
        return;
    }

    message.textContent = "Your sign-up form looks good! Account creation will be connected soon.";
});


// SHOW AND HIDE SIGNUP PASSWORDS
const passwordToggles = document.querySelectorAll(".toggle-signup-password");

passwordToggles.forEach(function(button) {
    button.addEventListener("click", function() {
        const targetId = button.getAttribute("data-target");
        const passwordField = document.getElementById(targetId);

        if (passwordField.type === "password") {
            passwordField.type = "text";
            button.textContent = "Hide";
        } else {
            passwordField.type = "password";
            button.textContent = "Show";
        }
    });
});