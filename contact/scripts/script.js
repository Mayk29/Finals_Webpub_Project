import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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

// Initialize Firebase and Realtime Database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

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
    document.getElementById("papajs").reset();
}

const saveMessages = async (fullname, email, contact, message) => {
    try {
        await set(ref(database, 'contacts/' + fullname), {
            fullname: fullname,
            email: email,
            contact: contact,
            message: message
        });
        document.querySelector(".alert").innerText = "Your message has been sent successfully!";
        document.querySelector(".alert").style.display = "block";
        setTimeout(() => {
            document.querySelector(".alert").style.display = "none";
        }, 3000);
    } catch (error) {
        document.querySelector(".alert").innerText = "Error sending message: " + error.message;
        document.querySelector(".alert").style.display = "block";
        setTimeout(() => {
            document.querySelector(".alert").style.display = "none";
        }, 3000);
    }
};

const getElementVal = (id) => {
    return document.getElementById(id).value;
};