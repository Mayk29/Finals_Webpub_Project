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
    document.getElementById("signupForm").addEventListener("submit", signupUser );
});

async function signupUser (e) {
    e.preventDefault();

    const name = getElementVal("name");
    const email = getElementVal("email").replace(/\./g, '_');
    const age = getElementVal("age");
    const location = getElementVal("location");
    const occupation = getElementVal("occupation");
    const password = getElementVal("password");

    try {
        await set(ref(database, 'users/' + email), {
            name: name,
            email: getElementVal("email"), 
            age: age,
            location: location,
            occupation: occupation,
            password: password
        });
        document.querySelector(".alert").innerText = "User  created successfully!";
        document.querySelector(".alert").style.display = "block";
        setTimeout(() => {
            document.querySelector(".alert").style.display = "none";
        }, 3000);
    } catch (error) {
        document.querySelector(".alert").innerText = "Error creating user: " + error.message;
        document.querySelector(".alert").style.display = "block";
        setTimeout(() => {
            document.querySelector(".alert").style.display = "none";
        }, 3000);
    }
}

function getElementVal(id) {
    return document.getElementById(id).value;
}