document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const container = document.getElementById("profile-info");
    const API_ENDPOINT = "http://localhost:5000/api/auth/me"; // Assumes backend route is /api/auth/me

    if (!token) {
        container.innerHTML = `<p class="error-message">Error: No login token found. Please <a href='auth.html'>sign in</a>.</p>`;
        return; // Stop the script if no token
    }

    async function loadProfile() {
        try {
            const res = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ msg: "Token might be invalid or expired." }));
                throw new Error(errorData.msg || "Please log in again.");
            }

            const user = await res.json();

            if (user && user.email) {
                // Renders the profile data in a structured way
                container.innerHTML = `
                    <div class="profile-item">
                        <span class="profile-label">Name</span>
                        <span class="profile-value">${user.name || "N/A"}</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-label">Email</span>
                        <span class="profile-value">${user.email}</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-label">User ID</span>
                        <span class="profile-value">${user._id || "N/A"}</span>
                    </div>
                `;
            } else {
                throw new Error("API returned incomplete user details.");
            }
        } catch (error) {
            console.error("Fetch failed:", error);
            container.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    loadProfile();
});