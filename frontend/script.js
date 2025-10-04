document.addEventListener("DOMContentLoaded", () => {
  // --- Sparkle Animation ---
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

  // --- Auth Page Tab Logic ---
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

  // --- Handle OAuth Token from URL ---
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const isNewUser = urlParams.get('isNewUser');

  if (token) {
    localStorage.setItem('token', token);
    if (isNewUser === 'true') {
      alert('Success! Welcome to the Grimoire.');
    } else {
      alert('Welcome back, Alchemist!');
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // --- API Connection Logic for Forms ---
  const signupForm = document.getElementById("signup-form");
  const signinForm = document.getElementById("signin-form");
  const API_URL = "http://localhost:5000/api/auth";

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
        alert("Success! Welcome to the Grimoire.");
        localStorage.setItem("token", data.token);
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
        alert("Welcome back, Alchemist!");
        localStorage.setItem("token", data.token);
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    });
  }

  // --- Password Toggle Logic ---
  const togglePasswordVisibility = (toggleIcon, passwordInput) => {
    if (toggleIcon && passwordInput) {
      toggleIcon.addEventListener('click', () => {
        // Toggle the type attribute
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle the icon
        toggleIcon.classList.toggle('fa-eye');
        toggleIcon.classList.toggle('fa-eye-slash');
      });
    }
  };

  // Apply the toggle logic to both password fields
  togglePasswordVisibility(
    document.getElementById('toggle-signin-password'),
    document.getElementById('signin-password')
  );

  togglePasswordVisibility(
    document.getElementById('toggle-signup-password'),
    document.getElementById('signup-password')
  );
});