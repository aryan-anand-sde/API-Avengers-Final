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
  
  // This 'if' condition is now more specific to prevent conflicts
  if (token && isNewUser !== null) {
    localStorage.setItem('token', token);
    if (isNewUser === 'true') {
      alert('Success! Welcome to the Grimoire.');
    } else {
      alert('Welcome back, Alchemist!');
    }
    window.history.replaceState({}, document.title, window.location.pathname);
    // window.location.href = '/dashboard.html'; 
  }

  // --- API Connection Logic for Forms ---
  const signupForm = document.getElementById("signup-form");
  const signinForm = document.getElementById("signin-form");
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  const resetPasswordForm = document.getElementById('reset-password-form');
  
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
  
  // Handle Forgot Password Form Submission
  if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          try {
              const res = await fetch(`${API_URL}/forgot-password`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
              });
              const data = await res.json();
              if (!res.ok) {
                  throw new Error(data.msg || 'Something went wrong.');
              }
              alert(data.msg);
          } catch (err) {
              alert(`Error: ${err.message}`);
          }
      });
  }

  // Handle Reset Password Form Submission
  if (resetPasswordForm) {
      resetPasswordForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirm-password').value;

          if (password !== confirmPassword) {
              return alert('Passwords do not match.');
          }

          const resetToken = new URLSearchParams(window.location.search).get('token');
          if (!resetToken) {
              return alert('Error: No reset token found in URL.');
          }

          try {
              const res = await fetch(`${API_URL}/reset-password/${resetToken}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password }),
              });
              const data = await res.json();
              if (!res.ok) {
                  throw new Error(data.msg || 'Something went wrong.');
              }
              alert(data.msg);
              window.location.href = 'auth.html';
          } catch (err) {
              alert(`Error: ${err.message}`);
          }
      });
  }

  // --- Password Toggle Logic ---
  const togglePasswordVisibility = (toggleIcon, passwordInput) => {
    if (toggleIcon && passwordInput) {
      toggleIcon.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleIcon.classList.toggle('fa-eye');
        toggleIcon.classList.toggle('fa-eye-slash');
      });
    }
  };

  togglePasswordVisibility(
    document.getElementById('toggle-signin-password'),
    document.getElementById('signin-password')
  );

  togglePasswordVisibility(
    document.getElementById('toggle-signup-password'),
    document.getElementById('signup-password')
  );
});