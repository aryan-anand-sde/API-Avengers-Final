document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const userIdEl = document.getElementById('user-id');
    const logoutBtn = document.getElementById('logout-btn');
    const API_ENDPOINT = "http://localhost:5000/api/auth/me";

    // --- AUTHENTICATION CHECK ---
    const token = localStorage.getItem('token');
    if (!token) {
        // MODIFIED: Redirect to index.html
        window.location.href = 'index.html';
        return;
    }

    // --- NOTIFICATION SYSTEM ---
    const showToast = (message, type = 'success') => {
        const toastContainer = document.getElementById("toast-container");
        if (!toastContainer) {
            console.error("Toast container not found!");
            return;
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    };

    // --- LOAD USER PROFILE DATA ---
    async function loadProfile() {
        if (!userNameEl || !userEmailEl || !userIdEl) {
            console.error("One or more profile elements are missing from the HTML.");
            return;
        }

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                console.warn("Unauthorized or Forbidden access. Logging out.");
                handleLogout();
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch user data from the server.');
            }

            const user = await response.json();

            userNameEl.textContent = user.name || 'N/A';
            userEmailEl.textContent = user.email || 'N/A';
            userIdEl.textContent = user._id || 'N/A';

        } catch (error) {
            console.error('Error loading profile:', error);
            userNameEl.textContent = 'Error loading data';
            userEmailEl.textContent = 'Please try again later.';
            userIdEl.textContent = '-';
            showToast(error.message, 'error');
        }
    }

    // --- LOGOUT FUNCTIONALITY ---
    function handleLogout() {
        localStorage.removeItem('token');
        showToast('You have been logged out.');

        setTimeout(() => {
            // MODIFIED: Redirect to index.html
            window.location.href = 'index.html';
        }, 1500);
    }

    // --- EVENT LISTENERS ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.error("Logout button not found in the HTML.");
    }

    // --- INITIAL LOAD ---
    loadProfile();
});