document.addEventListener("DOMContentLoaded", () => {
  emailjs.init("LQ3x9EcOs1j3fzcBD");

  const medicinesList = document.getElementById("medicines-list");
  const addMedicineForm = document.getElementById("add-medicine-form");

  // Function to send email reminder
  const sendEmailReminder = async (medicine) => {
    try {
      await emailjs.send(
        // EmailJS service ID
        "service_xfbizod",
        // EmailJS template ID
        "template_a5qemlc",
        {
          medicine_name: medicine.name,
          dosage: medicine.dosage,
          time: medicine.time,
          to_email: medicine.email,
        }
      );
      console.log("Email reminder sent successfully!");
    } catch (error) {
      console.error("Failed to send email reminder:", error);
    }
  };

  // Function to schedule email reminder
  const scheduleReminder = (medicine) => {
    const [time, period] = medicine.time.split(" ");
    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours);

    // Convert to 24-hour format
    if (period === "PM" && hour !== 12) {
      hour += 12;
    } else if (period === "AM" && hour === 12) {
      hour = 0;
    }

    // Get current date
    const now = new Date();
    const reminderTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      parseInt(minutes)
    );

    // If the time has passed for today, schedule for tomorrow
    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    // Schedule the reminder
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    setTimeout(() => {
      sendEmailReminder(medicine);
      // Schedule next day's reminder
      scheduleReminder(medicine);
    }, timeUntilReminder);
  };

  // Sample data for medicines
  const medicines = [
    { name: "Elixir of Life", dosage: "1 vial", time: "08:00 AM" },
    { name: "Potion of Strength", dosage: "2 drops", time: "12:00 PM" },
    { name: "Tonic of Wisdom", dosage: "1 teaspoon", time: "06:00 PM" },
  ];

  // Function to delete a medicine
  const deleteMedicine = (index) => {
    medicines.splice(index, 1);
    renderMedicines();
  };

  // Function to render medicines
  const renderMedicines = () => {
    medicinesList.innerHTML = "";
    medicines.forEach((medicine, index) => {
      const medicineItem = document.createElement("div");
      medicineItem.classList.add("medicine-item");
      medicineItem.innerHTML = `
                <div class="medicine-content">
                    <h3>${medicine.name}</h3>
                    <p>Dosage: ${medicine.dosage}</p>
                    <p>Time: ${medicine.time}</p>
                </div>
                <button class="btn btn-delete" onclick="this.parentElement.dispatchEvent(new CustomEvent('delete'))">
                    <i class="fas fa-trash"></i>
                </button>
            `;
      medicineItem.addEventListener("delete", () => deleteMedicine(index));
      medicinesList.appendChild(medicineItem);
    });
  };

  // Handle form submission
  addMedicineForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("medicine-name").value;
    const dosage = document.getElementById("medicine-dosage").value;
    const time = document.getElementById("medicine-time").value;
    const email = document.getElementById("reminder-email").value;

    // Format time to AM/PM format
    const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }
    );

    const newMedicine = {
      name,
      dosage,
      time: formattedTime,
      email,
    };
    medicines.push(newMedicine);

    // Schedule reminder for the new medicine
    scheduleReminder(newMedicine);

    // Reset form
    addMedicineForm.reset();
    renderMedicines();
  });

  // Initial render
  renderMedicines();
});
