document.addEventListener("DOMContentLoaded", () => {
    console.log("Settings page loaded.");

    // Example: Add logic for updating settings in the future
    const updatePasswordBtn = document.querySelector('button');
    const emailToggle = document.getElementById('email-reminders-toggle');

    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener('click', () => {
            const newPassword = document.getElementById('change-password').value;
            if (newPassword) {
                // In the future, you would send this to your backend API
                alert(`Password would be changed to: ${newPassword}`);
            } else {
                alert("Please enter a new password.");
            }
        });
    }

    if(emailToggle) {
        emailToggle.addEventListener('change', () => {
            // In the future, you would save this preference to the user's profile
            if (emailToggle.checked) {
                alert("Email reminders enabled.");
            } else {
                alert("Email reminders disabled.");
            }
        });
    }
});
