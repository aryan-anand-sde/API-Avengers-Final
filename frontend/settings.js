document.addEventListener("DOMContentLoaded", () => {
  const updateBtn = document.querySelector(".btn.btn-primary");

  updateBtn.addEventListener("click", async () => {
    const newPassword = document.getElementById("change-password").value.trim();
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You are not logged in!");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/update-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ " + data.message);
        document.getElementById("change-password").value = "";
      } else {
        alert("⚠️ " + data.message);
      }
    } catch (error) {
      console.error("Error updating password:", error);
      alert("❌ Something went wrong.");
    }
  });
});
