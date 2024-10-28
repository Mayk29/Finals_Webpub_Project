import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA_E5vZPfyCYgQqwUByKT5GpY9-onhtZXA",
    authDomain: "papajs-10c5e.firebaseapp.com",
    databaseURL: "https://papajs-10c5e-default-rtdb.firebaseio.com/",
    projectId: "papajs-10c5e",
    storageBucket: "papajs-10c5e.appspot.com",
    messagingSenderId: "2229621205",
    appId: "1:2229621205:web:ea4f72eceb87f43040ed5c",
    measurementId: "G-E7VC9SECHH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Function to fetch messages from Firebase
const fetchMessages = async () => {
    const messagesContainer = document.getElementById("messagesContainer");
    messagesContainer.innerHTML = ''; // Clear previous messages

    const messagesRef = ref(database, 'contacts/');
    const snapshot = await get(messagesRef);

    if (snapshot.exists()) {
        const messages = snapshot.val();
        for (const key in messages) {
            const message = messages[key];
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");
            messageElement.innerHTML = `
                <p><strong>Name:</strong> ${message.fullname}</p>
                <p><strong>Email:</strong> ${message.email}</p>
                <p><strong>Contact:</strong> ${message.contact}</p>
                <p><strong>Message:</strong> ${message.message}</p>
                <p><strong>Date Sent:</strong> ${new Date().toLocaleString()}</p>
                <hr>
            `;
            messagesContainer.appendChild(messageElement);
        }
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
