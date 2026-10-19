const escapeHtml = (value) => {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
};

// Function to fetch messages from the PHP API
const fetchMessages = async () => {
    const messagesContainer = document.getElementById("messagesContainer");
    messagesContainer.innerHTML = ''; // Clear previous messages

    let messages = [];
    try {
        const response = await fetch("../api/contacts");
        messages = await response.json();
    } catch (error) {
        messagesContainer.innerHTML = "<p>Could not load messages.</p>";
        return;
    }

    if (Array.isArray(messages) && messages.length > 0) {
        messages.forEach((message) => {
            const sent = message.created_at ? new Date(message.created_at.replace(" ", "T") + "Z") : new Date();
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");
            messageElement.innerHTML = `
                <p><strong>Name:</strong> ${escapeHtml(message.fullname)}</p>
                <p><strong>Message:</strong> ${escapeHtml(message.message)}</p>
                <p><strong>Date Sent:</strong> ${sent.toLocaleString()}</p>
                <hr>
            `;
            messagesContainer.appendChild(messageElement);
        });
    } else {
        messagesContainer.innerHTML = "<p>No messages found.</p>";
    }
};

// Function to search messages
const searchMessages = () => {
    const input = document.getElementById("search").value.trim().toLowerCase();
    const messages = document.querySelectorAll(".message");

    messages.forEach((message) => {
        const name = message.querySelector("p strong").nextSibling.textContent.trim().toLowerCase();

        if (name.includes(input)) {
            message.style.display = "block";
        } else {
            message.style.display = "none";
        }
    });
};

// Fetch messages on page load
document.addEventListener("DOMContentLoaded", fetchMessages);
document.getElementById("search").addEventListener("keyup", searchMessages);
