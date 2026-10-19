document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("signupForm").addEventListener("submit", signupUser );
});

async function signupUser (e) {
    e.preventDefault();

    const user = {
        name: getElementVal("name"),
        email: getElementVal("email"),
        age: getElementVal("age"),
        location: getElementVal("location"),
        occupation: getElementVal("occupation"),
        password: getElementVal("password")
    };

    try {
        const response = await fetch("../api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        });
        const result = await response.json();

        if (response.ok) {
            showAlert("User created successfully!");
            document.getElementById("signupForm").reset();
        } else {
            showAlert("Error creating user: " + (result.error || response.status));
        }
    } catch (error) {
        showAlert("Error creating user: " + error.message);
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
