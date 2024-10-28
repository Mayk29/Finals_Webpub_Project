import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js"; 

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
    document.getElementById("loginForm").addEventListener("submit", loginUser );
});

async function loginUser  (e) {
    e.preventDefault();

    const email = getElementVal("email");
    const password = getElementVal("password");
    const emailKey = email.replace('.', '_'); 

    console.log("Querying user with key:", emailKey); 

    try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, 'users/' + emailKey));

        console.log("Snapshot exists:", snapshot.exists(), "Data:", snapshot.val()); 

        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.password === password) {
                window.location.href = "../../landing/index.html";
            } else {
                showAlert("Incorrect password");
            }
        } else {
            showAlert("User  not found");
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