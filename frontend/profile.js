document.addEventListener("DOMContentLoaded", async () => {
    const API_ENDPOINT = "http://localhost:5000/api/auth/me";
    const container = document.getElementById("profile-info");
    const token = localStorage.getItem("token");

    if (!container) {
        console.error("❌ Element with ID 'profile-info' not found in HTML.");
        return;
    }

    if (!token) {
        console.warn("⚠️ No login token found in localStorage.");
        container.innerHTML = `
            <p class="error-message">
                You are not logged in. Please <a href="auth.html">sign in</a>.
            </p>`;
        return;
    }

    async function loadProfile() {
        try {
            console.log("🔍 Fetching user profile from:", API_ENDPOINT);

            const res = await fetch(API_ENDPOINT, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`, // ✅ Correct header
                },
            });

            console.log("📡 Response status:", res.status);

            if (res.status === 401) {
                // Token expired or invalid
                console.warn("⚠️ Unauthorized - removing token");
                localStorage.removeItem("token");
                container.innerHTML = `
                    <p class="error-message">
                        Session expired. Please <a href="auth.html">log in again</a>.
                    </p>`;
                return;
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Request failed (${res.status})`);
            }

            const user = await res.json();
            console.log("✅ User fetched successfully:", user);

            if (!user || !user.email) {
                throw new Error("Invalid user data received from server.");
            }

            // ✅ Display user info
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
        } catch (err) {
            console.error("❌ Fetch failed:", err);
            container.innerHTML = `
                <p class="error-message">Error loading profile: ${err.message}</p>`;
        }
    }

    await loadProfile();
});
