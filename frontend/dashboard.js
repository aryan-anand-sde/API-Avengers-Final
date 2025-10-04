document.addEventListener("DOMContentLoaded", () => {
  const medicinesList = document.getElementById("medicines-list");
  const addMedicineForm = document.getElementById("add-medicine-form");

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

    // Format time to AM/PM format
    const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }
    );

    medicines.push({
      name,
      dosage,
      time: formattedTime,
    });

    // Reset form
    addMedicineForm.reset();
    renderMedicines();
  });

  // Initial render
  renderMedicines();
});
