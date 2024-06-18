document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            const response = await fetch('https://il-gambero-rosso-github-io.onrender.com/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            if (result.success) {
                localStorage.setItem("currentUser", JSON.stringify(result.user));
                window.location.href = result.user.role === "admin" ? "admin.html" : "index.html";
            } else {
                alert(result.message);
            }
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            const newUsername = document.getElementById("newUsername").value;
            const newPassword = document.getElementById("newPassword").value;

            const response = await fetch('https://il-gambero-rosso-github-io.onrender.com/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: newUsername, password: newPassword })
            });

            const result = await response.json();
            if (result.success) {
                alert("Registration successful! You can now login.");
                window.location.href = "login.html";
            } else {
                alert(result.message);
            }
        });
    }
});
