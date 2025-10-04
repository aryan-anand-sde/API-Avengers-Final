// script.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Sparkle Animation (runs on both pages) ---
  const sparkleContainer = document.getElementById("sparkle-container");
  if (sparkleContainer) {
    const sparkleCount = 70;
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement("div");
      sparkle.classList.add("sparkle");
      sparkle.style.top = `${Math.random() * 100}%`;
      sparkle.style.left = `${Math.random() * 100}%`;
      const duration = Math.random() * 1.8 + 1.2;
      const delay = Math.random() * 2.5;
      sparkle.style.animationDuration = `${duration}s`;
      sparkle.style.animationDelay = `${delay}s`;
      const size = Math.random() * 2.5 + 1;
      sparkle.style.width = `${size}px`;
      sparkle.style.height = `${size}px`;
      sparkleContainer.appendChild(sparkle);
    }
  }

  // --- Auth Page Tab Logic (only runs if auth elements exist) ---
  const authTabsContainer = document.querySelector(".auth-tabs");
  if (authTabsContainer) {
    const tabLinks = authTabsContainer.querySelectorAll(".tab-link");
    const authForms = document.querySelectorAll(".auth-form");

    tabLinks.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab;
        tabLinks.forEach((link) => link.classList.remove("active"));
        tab.classList.add("active");
        authForms.forEach((form) => {
          form.classList.remove("active");
          if (form.id === `${targetTab}-form`) {
            form.classList.add("active");
          }
        });
      });
    });
  }

  // --- MISSING PART: API Connection Logic ---
  const signupForm = document.getElementById("signup-form");
  const signinForm = document.getElementById("signin-form");
  const API_URL = "http://localhost:5000/api/auth"; // Your backend server URL

  // Handle Sign Up
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("signup-name").value;
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;

      try {
        const res = await fetch(`${API_URL}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || "Something went wrong");
        }

        // On success, show alert, save the token, and redirect
        alert("Success! Welcome to the Grimoire.");
        localStorage.setItem("token", data.token);
        // window.location.href = 'dashboard.html'; // Optional: Redirect to another page
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    });
  }

  // Handle Sign In
  if (signinForm) {
    signinForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signin-email").value;
      const password = document.getElementById("signin-password").value;

      try {
        const res = await fetch(`${API_URL}/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || "Something went wrong");
        }

        // On success, show alert, save the token, and redirect
        alert("Welcome back, Alchemist!");
        localStorage.setItem("token", data.token);
        // window.location.href = 'dashboard.html'; // Optional: Redirect to another page
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    });
  }
});