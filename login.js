
// SHOW AND HIDE PASSWORD

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");

togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
    }
});


// TEMPORARY LOGIN DEMO

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;
    const message = document.getElementById("login-message");

    if (email === "" || password === "") {
        message.textContent = "Please fill in all fields.";
        return;
    }

    window.location.href = "diary.html";
});
