// --- State ---
let medicines = [];
let currentScheduleDate = new Date(); // Stores the currently selected date, initialized to today
let activeUndoTimers = {}; // Holds setTimeout IDs for the undo feature
let activeToastElement = null; // Reference to the current toast

// --- Elements ---
let listEl, emptyEl, searchEl;
let scheduleDateEl, prevDayBtn, nextDayBtn, todayBtn;
let adherenceMetricEl; // Adherence metric element selector

// Get the token once on load
const GLOBAL_TOKEN = localStorage.getItem("token");


// --- Helper Functions ---

/**
 * Normalizes a Date object to midnight (00:00:00) of that day in local time.
 * @param {Date} date
 * @returns {Date}
 */
function normalizeDateToMidnight(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
}

/**
 * Checks if the currentScheduleDate is today.
 * @returns {boolean}
 */
function isToday() {
    const today = new Date();
    return normalizeDateToMidnight(currentScheduleDate).getTime() === normalizeDateToMidnight(today).getTime();
}

/**
 * NEW: Checks if the currentScheduleDate is in the future.
 * @returns {boolean}
 */
function isFutureDate() {
    const today = normalizeDateToMidnight(new Date());
    const scheduled = normalizeDateToMidnight(currentScheduleDate);
    
    return scheduled > today;
}

/**
 * Formats a Date object to 'YYYY-MM-DD' for the input[type="date"] element and API.
 * NOTE: input[type="date"] MUST use YYYY-MM-DD format.
 * @param {Date} date 
 * @returns {string}
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * NEW: Formats a Date object to 'DD-MM-YYYY' string for display purposes.
 * @param {Date} date 
 * @returns {string}
 */
function formatDateForDisplay(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
}


/**
 * Filters the medicines array based on the currentScheduleDate (Start Date <= Selected Date <= End Date).
 */
function filterMedicinesByScheduleDate(items) {
    const selectedDate = normalizeDateToMidnight(currentScheduleDate);
    
    return items.filter(item => {
        if (!item.startDate || !item.endDate) { 
            return false;
        }
        
        const startDate = normalizeDateToMidnight(new Date(item.startDate)); 
        const endDate = normalizeDateToMidnight(new Date(item.endDate));

        const isStarted = selectedDate >= startDate; 
        const isNotEnded = selectedDate <= endDate; 
        
        return isStarted && isNotEnded;
    });
}

/**
 * Transforms the array of medicines into a flat array of individual doses,
 * injecting status from the backend's adherence map.
 */
function flattenMedicinesToDoses(medicines) {
    const doses = [];
    const formattedCurrentDate = formatDateForInput(currentScheduleDate);

    medicines.forEach(medicine => {
        const timesArray = Array.isArray(medicine.times) ? medicine.times : [];

        timesArray.forEach(time => {
            const doseId = `${medicine._id}-${time.replace(/\s/g, '-')}`;
            
            // Look up status from adherenceStatusMap for the current medicine and date
            const statusKey = `${medicine._id.toString()}_${formattedCurrentDate}_${time}`;
            const fetchedStatus = medicine.adherenceStatusMap ? medicine.adherenceStatusMap[statusKey] : undefined;

            const dose = {
                ...medicine,
                doseTime: time,
                doseId: doseId,
                status: fetchedStatus || 'pending' // Use fetched status or default to pending
            };
            doses.push(dose);
        });
    });
    return doses;
}

/**
 * Sanitizes a string to prevent XSS attacks.
 */
function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Displays the regular toast notification.
 */
const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) return;
    
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

/**
 * Calculates adherence score and updates the metric display.
 */
function updateAdherenceMetric(doses) {
    if (!adherenceMetricEl) return;

    const currentMoment = new Date();
    const formattedCurrentDate = formatDateForInput(currentScheduleDate);
    const formattedToday = formatDateForInput(currentMoment);

    // Only count doses that are scheduled for today OR are for a past date
    const relevantDoses = doses.filter(dose => {
        if (formattedCurrentDate < formattedToday) {
            return true; // All doses on a past day are relevant
        } else if (formattedCurrentDate === formattedToday) {
            // Only doses whose time has passed on today are relevant
            const doseTime = dose.doseTime; // HH:MM format
            const doseDateTime = new Date(`${formattedCurrentDate}T${doseTime}`);
            return doseDateTime <= currentMoment;
        }
        return false; // Future dates/doses are not relevant
    });

    const totalDoses = relevantDoses.length;
    let takenCount = 0;
    
    relevantDoses.forEach(dose => {
        if (dose.status === 'taken') {
            takenCount++;
        }
    });

    const metricValueEl = adherenceMetricEl.querySelector('.metric-value');
    const metricLabelEl = adherenceMetricEl.querySelector('.metric-label');

    if (totalDoses === 0) {
        metricValueEl.textContent = 'N/A';
        metricLabelEl.textContent = 'Scheduled Doses';
        adherenceMetricEl.style.backgroundColor = 'var(--text-muted)';
    } else {
        const percent = Math.round((takenCount / totalDoses) * 100);
        metricValueEl.textContent = `${takenCount}/${totalDoses} (${percent}%)`;
        metricLabelEl.textContent = 'Doses Taken';
        
        if (percent >= 80) {
            adherenceMetricEl.style.backgroundColor = 'var(--success-color)'; // Green
        } else if (percent >= 50) {
            adherenceMetricEl.style.backgroundColor = 'var(--gradient-end)'; // Amber/Yellow
        } else {
            adherenceMetricEl.style.backgroundColor = 'var(--delete-red)'; // Red
        }
    }
}


// --- API and Main Data Flow Functions ---

/**
 * Unified helper for making authenticated API requests.
 */
const apiFetch = async (url, options = {}) => {
    const { body, method = 'POST', ...otherOptions } = options;
    
    const requestOptions = {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GLOBAL_TOKEN}` 
        },
        body: body ? JSON.stringify(body) : undefined,
        ...otherOptions
    };

    const res = await fetch(`http://localhost:5000/api${url}`, requestOptions);

    // Handle 401 response explicitly for redirection
    if (res.status === 401) {
        localStorage.removeItem('token');
        showToast('Session expired. Redirecting...', 'error');
        if (listEl) {
             listEl.innerHTML = '<div class="error-message">Session expired. Redirecting...</div>';
        }
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
        throw new Error("Unauthorized");
    }

    if (!res.ok) {
        try {
            const errorData = await res.json();
            throw new Error(errorData.message || `Request to ${url} failed`);
        } catch (e) {
            // If JSON parsing fails (e.g., HTML response from server error)
            throw new Error(`Request to ${url} failed with status ${res.status}`);
        }
    }
    return res.json();
};

/**
 * Action: Immediately updates the status via API and refreshes the list.
 */
async function updateMedicineStatus(id, doseTime, status) {
    const formattedDate = formatDateForInput(currentScheduleDate); 
    
    try {
        const card = document.querySelector(`[data-dose-id="${id}-${doseTime.replace(/\s/g, '-')}" ]`);
        const cardTitle = card ? card.querySelector('h3').textContent : 'Medicine';

        // 1. Send API call immediately 
        await apiFetch(`/medicines/${id}/dose-status`, { 
            method: 'PUT',
            body: { 
                date: formattedDate, 
                time: doseTime, 
                status 
            }
        });
        
        // 2. Refresh the list to load the permanent status from backend
        await loadAllMedicines(); 
        showToast(`Dose of ${cardTitle} marked as ${status}.`, status);

    } catch (err) {
        if (err.message !== "Unauthorized") {
             console.error("Status update failed:", err);
             showToast("Error updating status. Please try again.", "error"); 
        }
    }
}

/**
 * Fetches the list of all medicines from the API, sending the selected date.
 */
async function loadAllMedicines() {
    if (!GLOBAL_TOKEN) {
        return; 
    }
    
    const selectedDate = formatDateForInput(currentScheduleDate);

    listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Loading schedule...</div>'; 

    try {
        const response = await apiFetch("/medicines/list", {
            body: { selectedDate }, 
        });

        medicines = response || []; 
        filterAndRenderList(); 
    } catch (err) {
        if (err.message !== "Unauthorized") {
            console.error("API Error:", err);
            listEl.innerHTML = `<div class="error-message">Failed to load medicines: ${err.message}. Check your API server.</div>`;
        }
    }
}

/**
 * Filters the main medicine list, flattens to doses, calculates metric, and re-renders.
 */
function filterAndRenderList() {
    const dateFiltered = filterMedicinesByScheduleDate(medicines);
    
    let dosesToRender = flattenMedicinesToDoses(dateFiltered);
    
    // Calculate and update the adherence metric
    updateAdherenceMetric(dosesToRender); 

    const query = searchEl ? searchEl.value.trim().toLowerCase() : '';

    if (query) {
        const finalFiltered = dosesToRender.filter(
            (m) =>
            (m.name && m.name.toLowerCase().includes(query)) ||
            (m.dosage && m.dosage.toLowerCase().includes(query))
        );
        renderList(finalFiltered);
    } else {
        renderList(dosesToRender);
    }
}

/**
 * Renders the filtered list of doses in the DOM.
 */
function renderList(items) {
    if (!listEl || !emptyEl) return;

    // --- FIX APPLIED HERE: Use formatDateForDisplay ---
    const displayDate = formatDateForDisplay(currentScheduleDate); 

    if (!items || items.length === 0) {
        listEl.innerHTML = "";
        emptyEl.hidden = false;
        emptyEl.querySelector('h3').textContent = 'No Scheduled Doses';
        emptyEl.querySelector('p').textContent = `Nothing is scheduled for ${displayDate}.`;
        return;
    }

    emptyEl.hidden = true;
    let html = "";

    // Sort items by doseTime (Earliest First)
    items.sort((a, b) => {
        const dateA = new Date(`2000/01/01 ${a.doseTime}`);
        const dateB = new Date(`2000/01/01 ${b.doseTime}`);
        return dateA - dateB;
    });

    // Determine when actions are enabled
    const isFuture = isFutureDate();

    items.forEach(m => {
        const doseId = `${m._id}-${m.doseTime.replace(/\s/g, '-')}`;
        const currentStatus = m.status || 'pending';
        
        let actionsHtml = '';
        
        if (currentStatus === 'taken') {
            actionsHtml = `<span class="status-indicator taken"><i class="fa-solid fa-check-circle"></i> Taken</span>`;
        } else if (currentStatus === 'missed') {
            actionsHtml = `<span class="status-indicator missed"><i class="fa-solid fa-times-circle"></i> Missed</span>`;
        } else if (isFuture) {
            // 1. If viewing a future date, show nothing.
            actionsHtml = '';
        } else if (isToday()) {
            // 2. If viewing today, check if the time has passed.
            const doseDateTime = new Date(`${formatDateForInput(currentScheduleDate)}T${m.doseTime}`);
            const isFutureTimeToday = doseDateTime > new Date();

            if (isFutureTimeToday) {
                 actionsHtml = ''; // Do not show buttons for future times today
            } else {
                 actionsHtml = `
                    <button class="btn btn-primary btn-action-text" title="Mark as Taken" data-id="${m._id}" data-dose-time="${m.doseTime}" data-action="taken">Taken</button>
                    <button class="btn btn-secondary btn-action-text" title="Mark as Missed" data-id="${m._id}" data-dose-time="${m.doseTime}" data-action="missed">Missed</button>
                 `;
            }
        } else {
            // 3. If viewing a past date (and status is pending), show buttons.
             actionsHtml = `
                <button class="btn btn-primary btn-action-text" title="Mark as Taken" data-id="${m._id}" data-dose-time="${m.doseTime}" data-action="taken">Taken</button>
                <button class="btn btn-secondary btn-action-text" title="Mark as Missed" data-id="${m._id}" data-dose-time="${m.doseTime}" data-action="missed">Missed</button>
             `;
        }

        html += `
            <article class="medicine-item" data-id="${m._id}" data-dose-id="${doseId}" data-status="${currentStatus}">
              <div class="medicine-content">
                <h3>${escapeHtml(m.name)}</h3>
                <p>${escapeHtml(m.dosage)} • Scheduled for: <strong class="time-display">${escapeHtml(m.doseTime)}</strong></p>
              </div>
              <div class="medicine-actions">
                ${actionsHtml}
              </div>
            </article>
        `;
    });

    listEl.innerHTML = html;
    attachActionHandlers();
}

/**
 * Attaches click event listeners to action buttons.
 */
function attachActionHandlers() {
    if (!listEl) return;
    
    document.querySelectorAll(".btn-action-text").forEach((btn) => {
        
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            const doseTime = btn.getAttribute("data-dose-time");
            const action = btn.getAttribute("data-action");

            if (action === "taken" || action === "missed") {
                await updateMedicineStatus(id, doseTime, action); 
            }
        });
    });
}


/**
 * Changes the currentScheduleDate and triggers a list update.
 */
function changeDate(daysToAdd) {
    currentScheduleDate.setDate(currentScheduleDate.getDate() + daysToAdd);
    scheduleDateEl.value = formatDateForInput(currentScheduleDate);
    loadAllMedicines(); // Load fresh data for the new date
}

/**
 * Sets the date to today and triggers a list update.
 */
function setDateToToday() {
    currentScheduleDate = new Date();
    scheduleDateEl.value = formatDateForInput(currentScheduleDate);
    loadAllMedicines(); // Load fresh data for today
}


// --- Initializer ---
document.addEventListener("DOMContentLoaded", () => {
    // Check for token immediately and redirect if missing
    if (!GLOBAL_TOKEN) {
        if (document.body) {
            document.body.innerHTML = '<div class="error-message" style="text-align: center; padding: 50px;">Authentication required. Redirecting to login...</div>';
        }
        setTimeout(() => { window.location.href = 'login.html'; }, 500);
        return;
    }

    // Assign elements from the DOM
    listEl = document.getElementById("medicines-list");
    emptyEl = document.getElementById("empty");
    searchEl = document.getElementById("search");
    
    // Date elements
    scheduleDateEl = document.getElementById("schedule-date");
    prevDayBtn = document.getElementById("prev-day");
    nextDayBtn = document.getElementById("next-day");
    todayBtn = document.getElementById("today-btn");
    adherenceMetricEl = document.getElementById("adherence-metric"); // NEW

    // Initialize the date input to today's date
    scheduleDateEl.value = formatDateForInput(currentScheduleDate);

    // Attach Event Listeners for the date controls
    scheduleDateEl.addEventListener("change", (e) => {
        // When user manually selects a date, use the value directly
        currentScheduleDate = new Date(e.target.value);
        loadAllMedicines(); // Load fresh data for the new date
    });
    
    prevDayBtn.addEventListener("click", () => changeDate(-1));
    nextDayBtn.addEventListener("click", () => changeDate(1));
    todayBtn.addEventListener("click", setDateToToday);

    // Attach Event Listener for the search bar 
    searchEl.addEventListener("input", filterAndRenderList);

    // Initial Load
    loadAllMedicines();
});
