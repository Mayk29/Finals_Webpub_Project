document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginForm").addEventListener("submit", loginUser );
});

async function loginUser  (e) {
    e.preventDefault();

    const email = getElementVal("email");
    const password = getElementVal("password");

    try {
        const response = await fetch("../api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        });
        const result = await response.json();

        if (response.ok) {
            window.location.href = "../landing/index.html";
        } else {
            showAlert(result.error || "Error logging in");
        }
    } catch (error) {
        showAlert("Error logging in: " + error.message);
    }
}

function getElementVal(id) {
    return document.getElementById(id).value;
}

function showAlert(message) {
    const alertBox = document.querySelector(".alert");
    alertBox.innerText = message;
    alertBox.style.display = "block";
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
