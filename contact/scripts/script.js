document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("papajs").addEventListener("submit", submitForm);
});

function submitForm(e) {
    e.preventDefault();

    const fullname = getElementVal("fullname");
    const email = getElementVal("email");
    const contact = getElementVal("contact");
    const message = getElementVal("message");

    saveMessages(fullname, email, contact, message);
}

const saveMessages = async (fullname, email, contact, message) => {
    try {
        const response = await fetch("../api/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullname, email, contact, message })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || response.status);
        }
        document.getElementById("papajs").reset();
        showAlert("Your message has been sent successfully!");
    } catch (error) {
        showAlert("Error sending message: " + error.message);
    }
};

const showAlert = (message) => {
    document.querySelector(".alert").innerText = message;
    document.querySelector(".alert").style.display = "block";
    setTimeout(() => {
        document.querySelector(".alert").style.display = "none";
    }, 3000);
};

const getElementVal = (id) => {
    return document.getElementById(id).value;
};
