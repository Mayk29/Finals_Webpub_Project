document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("papajs").addEventListener("submit", submitForm);
});

function submitForm(e) {
    e.preventDefault();

    const fullname = getElementVal("fullname");
    const email = getElementVal("email");
    const contact = getElementVal("contact");
    const message = getElementVal("message");

    if (!/^[0-9+()\-\s]{7,30}$/.test(contact)) {
        showAlert("Please enter a valid contact number, for example 0917 123 4567.", true);
        return;
    }
    saveMessages(fullname, email, contact, message);
}

const saveMessages = async (fullname, email, contact, message) => {
    const button = document.getElementById("send-btn");
    button.disabled = true;
    button.textContent = "Sending...";
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
        showAlert("Thank you! Your message has been sent. We will get back to you soon.");
    } catch (error) {
        showAlert("Error sending message: " + error.message, true);
    }
    button.disabled = false;
    button.textContent = "Submit Form";
};

const showAlert = (message, isError) => {
    const alertBox = document.querySelector(".alert");
    alertBox.innerText = message;
    alertBox.style.color = isError ? "#ff6b6b" : "#6fdc7c";
    alertBox.style.display = "block";
    clearTimeout(showAlert.timer);
    showAlert.timer = setTimeout(() => {
        alertBox.style.display = "none";
    }, 6000);
};

const getElementVal = (id) => {
    return document.getElementById(id).value;
};
