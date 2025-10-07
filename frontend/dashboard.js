const token = localStorage.getItem("token");

document
  .getElementById("add-medicine-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("medicine-name").value;
    const dosage = document.getElementById("medicine-dosage").value;
    const timeRaw = document.getElementById("medicine-time").value;
    const email = document.getElementById("reminder-email").value;

    // Format time to AM/PM like earlier code
    const formattedTime = new Date(`2000-01-01T${timeRaw}`).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }
    );

    const data = { token, name, dosage, time: formattedTime, email };

    try {
      const res = await fetch("http://localhost:5000/api/medicines/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to add");
      }

      alert("Medicine added successfully!");
      e.target.reset();
      // Refresh list from server
      await loadMedicines();
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not add medicine");
    }
  });

document.addEventListener("DOMContentLoaded", () => {
  emailjs.init("LQ3x9EcOs1j3fzcBD");

  const medicinesList = document.getElementById("medicines-list");
  const addMedicineForm = document.getElementById("add-medicine-form");

  let medicines = [];

  async function loadMedicines() {
    try {
      const res = await fetch("http://localhost:5000/api/medicines/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error("Failed to load medicines");
      medicines = await res.json();
      renderMedicines();
      // refresh analytics for current selected range (if UI has values)
      try {
        const sdEl = document.getElementById("startDate");
        const edEl = document.getElementById("endDate");
        const sd = sdEl ? sdEl.value : null;
        const ed = edEl ? edEl.value : null;
        await loadAnalytics(sd || null, ed || null);
      } catch (e) {
        // ignore analytics errors here
      }
      // schedule reminders for loaded medicines that have an email and time
      try {
        medicines.forEach((m) => {
          if (m.time && m.email) scheduleReminder(m);
        });
      } catch (e) {
        console.warn("Could not schedule reminders for medicines", e);
      }
    } catch (err) {
      console.error(err);
      medicinesList.innerHTML =
        '<div class="error">Could not load medicines. Make sure backend is running.</div>';
    }
  }

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

  // helper to escape HTML when rendering
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to delete a medicine by id (server-side)
  const deleteMedicine = async (id) => {
    if (!confirm("Delete this medicine?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/medicines/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Delete failed");
      await loadMedicines();
      try {
        const sdEl = document.getElementById("startDate");
        const edEl = document.getElementById("endDate");
        const sd = sdEl ? sdEl.value : null;
        const ed = edEl ? edEl.value : null;
        await loadAnalytics(sd || null, ed || null);
      } catch (e) {}
    } catch (err) {
      console.error(err);
      alert(err.message || "Delete failed");
    }
  };

  // Mark taken/missed by id
  const setTakenStatus = async (id, taken) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/medicines/${id}/taken`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, taken }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Update failed");
      await loadMedicines();
      try {
        const sdEl = document.getElementById("startDate");
        const edEl = document.getElementById("endDate");
        const sd = sdEl ? sdEl.value : null;
        const ed = edEl ? edEl.value : null;
        await loadAnalytics(sd || null, ed || null);
      } catch (e) {}
    } catch (err) {
      console.error(err);
      alert(err.message || "Update failed");
    }
  };

  // Function to render medicines from server
  const renderMedicines = () => {
    medicinesList.innerHTML = "";
    medicines.forEach((medicine) => {
      const medicineItem = document.createElement("div");
      medicineItem.classList.add("medicine-item");
      // compute status and display takenAt
      const taken = Boolean(medicine.taken);
      const takenAt = medicine.takenAt ? new Date(medicine.takenAt) : null;
      let statusHtml =
        '<span class="status-pill status-pending">Pending</span>';
      if (taken)
        statusHtml = `<span class="status-pill status-on-time">Taken</span>`;
      else if (medicine.taken === false)
        statusHtml = `<span class="status-pill status-late">Missed</span>`;

      // Determine number of doses for UI boxes
      // Prefer explicit 'times' array if provided by backend; otherwise try to infer count from dosage string (e.g. "2 pills") or default to 1
      let timesArray = [];
      if (Array.isArray(medicine.times) && medicine.times.length > 0) {
        timesArray = medicine.times;
      } else {
        // parse number from dosage like "2 pills"
        const match = String(medicine.dosage || "").match(/(\d+)/);
        const count = match ? Math.max(1, parseInt(match[1], 10)) : 1;
        // if backend provided a single time string, use it for every dose; otherwise show placeholders
        const timeLabel = medicine.time || "—";
        for (let i = 0; i < count; i++) timesArray.push(timeLabel);
      }

      // per-day tick storage key (unique per user token, date and medicine id)
      const getTodayKey = (medId) => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const dateKey = `${y}-${m}-${d}`;
        const tok = token || "anon";
        return `doseTicks:${tok}:${dateKey}:${medId}`;
      };

      const loadDoseTicks = (medId, len) => {
        try {
          const raw = localStorage.getItem(getTodayKey(medId));
          if (!raw) return new Array(len).fill(false);
          const arr = JSON.parse(raw);
          if (!Array.isArray(arr)) return new Array(len).fill(false);
          // normalize length
          const out = new Array(len).fill(false);
          for (let i = 0; i < Math.min(len, arr.length); i++)
            out[i] = Boolean(arr[i]);
          return out;
        } catch (e) {
          return new Array(len).fill(false);
        }
      };

      const saveDoseTicks = (medId, arr) => {
        try {
          localStorage.setItem(getTodayKey(medId), JSON.stringify(arr));
        } catch (e) {
          console.warn("Could not save dose ticks", e);
        }
      };

      const doseTicks = loadDoseTicks(medicine._id, timesArray.length);

      // build boxes HTML
      const boxesHtml = timesArray
        .map((t, idx) => {
          const checked = doseTicks[idx] ? "checked" : "";
          const label = t || `Dose ${idx + 1}`;
          return `<label class="dose-box" data-med="${
            medicine._id
          }" data-idx="${idx}"><input type="checkbox" class="dose-checkbox" ${checked}><span class="dose-label">${escapeHtml(
            label
          )}</span></label>`;
        })
        .join("");

      medicineItem.innerHTML = `
        <div class="medicine-content">
          <h3>${escapeHtml(medicine.name)} ${statusHtml}</h3>
          <p>Dosage: ${escapeHtml(medicine.dosage)}</p>
          <p class="time-line">Time: ${escapeHtml(
            medicine.time || timesArray[0] || "—"
          )}</p>
          ${
            takenAt
              ? `<p class="taken-at">Taken at: ${takenAt.toLocaleString()}</p>`
              : ""
          }
          <div class="dose-boxes">${boxesHtml}</div>
        </div>
        <div class="medicine-actions">
          <button class="btn" data-id="${medicine._id}" data-action="taken">${
        taken ? "Taken" : "Mark Taken"
      }</button>
          <button class="btn" data-id="${medicine._id}" data-action="missed">${
        !taken ? "Missed" : "Mark Missed"
      }</button>
          <button class="btn btn-delete" data-id="${
            medicine._id
          }" data-action="delete"><i class="fas fa-trash"></i></button>
        </div>
      `;

      // attach listeners for dose boxes
      // (use event delegation after element is in DOM)
      medicinesList.appendChild(medicineItem);

      medicineItem.querySelectorAll(".dose-box").forEach((lbl) => {
        const chk = lbl.querySelector(".dose-checkbox");
        const medId = lbl.getAttribute("data-med");
        const idx = Number(lbl.getAttribute("data-idx"));
        chk.addEventListener("change", (ev) => {
          const arr = loadDoseTicks(medId, timesArray.length);
          arr[idx] = !!chk.checked;
          saveDoseTicks(medId, arr);
          // optionally, mark the whole medicine as taken if all boxes checked
          if (arr.every(Boolean)) {
            // mark medicine overall taken on server
            setTakenStatus(medId, true).catch(() => {});
          }
        });
      });

      // attach action listeners (delete/taken/missed)
      medicineItem.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const action = btn.getAttribute("data-action");
          if (action === "delete") return deleteMedicine(id);
          if (action === "taken") return setTakenStatus(id, true);
          if (action === "missed") return setTakenStatus(id, false);
        });
      });
    });
  };

  // ---- Analytics functions for dashboard ----
  async function loadAnalytics(startDate, endDate) {
    try {
      const res = await fetch("http://localhost:5000/api/analytics/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, startDate, endDate }),
      });
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      renderDailySummary(json.daily || []);
    } catch (err) {
      console.error(err);
      const container = document.getElementById("daily-summary");
      if (container)
        container.innerHTML =
          '<div class="error">Could not load analytics</div>';
    }
  }

  function renderDailySummary(daily) {
    const container = document.getElementById("daily-summary");
    if (!container) return;
    if (!daily || daily.length === 0) {
      container.innerHTML =
        '<div class="empty">No daily data for selected range</div>';
      return;
    }

    container.innerHTML = `<table class="daily-table"><thead><tr><th>Date</th><th>Total</th><th>Taken</th><th>Missed</th></tr></thead><tbody>${daily
      .map(
        (d) =>
          `<tr><td>${d.date}</td><td>${d.total}</td><td>${d.taken}</td><td>${d.missed}</td></tr>`
      )
      .join("")}</tbody></table>`;
  }

  // Wire showDaily button if present
  const showBtn = document.getElementById("showDaily");
  if (showBtn)
    showBtn.addEventListener("click", () => {
      const startDate = document.getElementById("startDate").value || null;
      const endDate = document.getElementById("endDate").value || null;
      loadAnalytics(startDate, endDate);
    });

  // Handle form submission (legacy scheduling handled separately after saving)
  addMedicineForm.addEventListener("submit", (e) => {
    // handled above by fetch to /add
  });

  // Initial load from server
  loadMedicines();
});
