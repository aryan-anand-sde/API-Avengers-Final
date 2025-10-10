document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("No token found. Please log in.");
        document.getElementById('add-medicine-form').style.opacity = '0.5';
        document.getElementById('add-medicine-form').style.pointerEvents = 'none';
        return;
    }

    // --- GLOBAL STATE ---
    let allMedicines = [];

    // --- ELEMENT SELECTORS ---
    const addMedicineForm = document.getElementById("add-medicine-form");
    const medicinesList = document.getElementById("medicines-list");
    const addTimeBtn = document.getElementById("add-time-btn");
    const timeInputsContainer = document.getElementById("time-inputs-container");
    const searchBar = document.getElementById("search-bar");
    const sortBy = document.getElementById("sort-by");
    const editModal = document.getElementById("edit-modal");
    const editForm = document.getElementById("edit-medicine-form");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    const editTimeInputsContainer = document.getElementById("edit-time-inputs-container");
    const editAddTimeBtn = document.getElementById("edit-add-time-btn");

    if (!addMedicineForm || !medicinesList || !editModal || !searchBar || !sortBy) {
        console.error("A critical page element is missing. Check your HTML IDs.");
        return;
    }

    // --- DYNAMIC TIME INPUTS LOGIC ---
    const setupTimeInputs = (container, button) => {
        button.addEventListener('click', () => {
            const group = document.createElement('div');
            group.className = 'time-input-group';
            group.innerHTML = `<input type="time" class="medicine-time" required><button type="button" class="btn-remove-time">&times;</button>`;
            container.appendChild(group);
            group.querySelector('.btn-remove-time').addEventListener('click', (e) => e.target.parentElement.remove());
        });
    };
    setupTimeInputs(timeInputsContainer, addTimeBtn);
    setupTimeInputs(editTimeInputsContainer, editAddTimeBtn);

    // --- NOTIFICATION SYSTEM ---
    const showToast = (message, type = 'success') => {
        const toastContainer = document.getElementById("toast-container");
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

    // --- HELPER & API FUNCTIONS ---
    function escapeHtml(str) {
        if (!str && str !== 0) return "";
        return String(str)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    /**
     * Reformats a date string from YYYY-MM-DD to DD-MM-YYYY.
     * @param {string} dateString The date string from the API (e.g., "2025-10-11" or "2025-10-11T...").
     * @returns {string} The formatted date string (e.g., "11-10-2025").
     */
    function formatApiDate(dateString) {
        if (!dateString) return 'N/A';
        
        // Take only the date part (YYYY-MM-DD)
        const datePart = dateString.split('T')[0];
        const parts = datePart.split('-');
        
        if (parts.length === 3) {
            // Reorder to dd-mm-yyyy
            return `${parts[2]}-${parts[1]}-${parts[0]}`; 
        }
        return dateString; // Return original if format is unexpected
    }

    const apiFetch = async (url, options = {}) => {
        const { body, ...otherOptions } = options;
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, ...body }),
            ...otherOptions
        };
        const res = await fetch(`http://localhost:5000/api${url}`, requestOptions);
        if (!res.ok) {
            try {
                const errorData = await res.json();
                throw new Error(errorData.message || `Request to ${url} failed`);
            } catch (e) {
                throw new Error(`Request to ${url} failed with status ${res.status}`);
            }
        }
        return res.json();
    };

    // --- CORE DATA FUNCTIONS ---
    async function loadMedicines(highlightId = null) {
        try {
            allMedicines = await apiFetch('/medicines/list', {}) || [];
            filterAndRenderMedicines();
            if (highlightId) {
                const itemToHighlight = document.querySelector(`[data-id='${highlightId}']`);
                if (itemToHighlight) {
                    itemToHighlight.classList.add('medicine-item--highlighted');
                    setTimeout(() => itemToHighlight.classList.remove('medicine-item--highlighted'), 2500);
                }
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
    
    // --- RENDER, SORT, AND FILTER LOGIC ---
    const filterAndRenderMedicines = () => {
        let medicinesToRender = [...allMedicines];
        const searchTerm = searchBar.value.toLowerCase();
        const sortValue = sortBy.value;

        if (searchTerm) {
            medicinesToRender = medicinesToRender.filter(med => med.name.toLowerCase().includes(searchTerm));
        }

        const getEarliestTime = (times) => {
            if (!times || times.length === 0) return null;
            const dateObjects = times.map(t => new Date(`1970/01/01 ${t}`));
            return new Date(Math.min.apply(null, dateObjects));
        };
        
        const getLatestTime = (times) => {
            if (!times || times.length === 0) return null;
            const dateObjects = times.map(t => new Date(`1970/01/01 ${t}`));
            return new Date(Math.max.apply(null, dateObjects));
        };

        switch (sortValue) {
            case 'name-asc':
                medicinesToRender.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'time-asc':
                medicinesToRender.sort((a, b) => getEarliestTime(a.times) - getEarliestTime(b.times));
                break;
            case 'time-desc':
                medicinesToRender.sort((a, b) => getLatestTime(b.times) - getLatestTime(a.times));
                break;
            case 'start-date-asc':
                medicinesToRender.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                break;
            case 'end-date-asc':
                medicinesToRender.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
                break;
            case 'recent':
            default:
                medicinesToRender.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        renderMedicines(medicinesToRender);
    };

    function renderMedicines(medicines) {
        medicinesList.innerHTML = "";
        if (medicines.length === 0) {
            medicinesList.innerHTML = "<p>No medicines found.</p>";
            return;
        }
        medicines.forEach(med => {
            const item = document.createElement("div");
            item.className = "medicine-item";
            item.dataset.id = med._id;
            const timesDisplay = Array.isArray(med.times) ? med.times.join(', ') : 'N/A';
            
            // --- MODIFIED: Date Formatting Applied Here ---
            const displayStartDate = formatApiDate(med.startDate);
            const displayEndDate = formatApiDate(med.endDate);
            // ---------------------------------------------
            
            item.innerHTML = `
                <div class="medicine-content">
                    <h3>${escapeHtml(med.name)}</h3>
                    <p>Dosage: ${escapeHtml(med.dosage)}</p>
                    <p>Time(s): ${escapeHtml(timesDisplay)}</p>
                    <p>Duration: ${displayStartDate} to ${displayEndDate}</p>
                </div>
                <div class="medicine-actions">
                    <button class="btn-action edit"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-action delete"><i class="fas fa-trash"></i></button>
                </div>`;
            
            item.querySelector('.edit').addEventListener('click', () => openEditModal(med));
            item.querySelector('.delete').addEventListener('click', () => deleteMedicine(med._id, med.name));
            medicinesList.appendChild(item);
        });
    }

    // --- EDIT MODAL LOGIC ---
    const openEditModal = (med) => {
        document.getElementById('edit-medicine-id').value = med._id;
        document.getElementById('edit-medicine-name').value = med.name;
        document.getElementById('edit-reminder-email').value = med.email;
        // NOTE: The values below should be in YYYY-MM-DDTHH:MM format for the datetime-local inputs
        document.getElementById('edit-start-date').value = med.startDate;
        document.getElementById('edit-end-date').value = med.endDate;

        const dosageParts = med.dosage.split(' ');
        document.getElementById('edit-dosage-amount').value = dosageParts[0];
        document.getElementById('edit-dosage-unit').value = dosageParts.slice(1).join(' ');

        editTimeInputsContainer.innerHTML = '';
        med.times.forEach(time => {
            const group = document.createElement('div');
            group.className = 'time-input-group';
            // Convert AM/PM time back to 24hr format for the input[type="time"]
            // This logic is complex, but this is a common approximation for time parsing:
            const time24hr = new Date(`1970-01-01 ${time}`).toTimeString().slice(0, 5); 
            group.innerHTML = `<input type="time" class="medicine-time" value="${time24hr}" required>`;
            editTimeInputsContainer.appendChild(group);
        });
        editModal.style.display = 'flex';
    };
    const closeEditModal = () => { editModal.style.display = 'none'; };

    // --- EVENT LISTENERS ---
    searchBar.addEventListener('input', filterAndRenderMedicines);
    sortBy.addEventListener('change', filterAndRenderMedicines);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
    
    addMedicineForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById("medicine-name").value,
            email: document.getElementById("reminder-email").value,
            startDate: document.getElementById("start-date").value,
            endDate: document.getElementById("end-date").value,
            dosage: `${document.getElementById("dosage-amount").value} ${document.getElementById("dosage-unit").value}`,
            times: Array.from(document.querySelectorAll('#time-inputs-container .medicine-time')).map(input => {
                if (!input.value) return null;
                // Converts 24hr input (HH:MM) to AM/PM string for storage
                return new Date(`1970-01-01T${input.value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
            }).filter(Boolean)
        };
        if (formData.times.length === 0) { showToast("Please add at least one time.", "error"); return; }
        try {
            const addedMedicine = await apiFetch('/medicines/add', { body: formData });
            showToast("Medicine added successfully!");
            addMedicineForm.reset();
            // Remove all but the first time input field
            while (timeInputsContainer.children.length > 1) { timeInputsContainer.removeChild(timeInputsContainer.lastChild); }
            loadMedicines(addedMedicine._id);
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
    
    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-medicine-id').value;
        const updatedData = {
            name: document.getElementById("edit-medicine-name").value,
            email: document.getElementById("edit-reminder-email").value,
            startDate: document.getElementById("edit-start-date").value,
            endDate: document.getElementById("edit-end-date").value,
            dosage: `${document.getElementById("edit-dosage-amount").value} ${document.getElementById("edit-dosage-unit").value}`,
            times: Array.from(document.querySelectorAll('#edit-time-inputs-container .medicine-time')).map(input => {
                if (!input.value) return null;
                // Converts 24hr input (HH:MM) to AM/PM string for storage
                return new Date(`1970-01-01T${input.value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
            }).filter(Boolean)
        };
        if (updatedData.times.length === 0) { showToast("Please add at least one time.", "error"); return; }
        try {
            await apiFetch(`/medicines/${id}`, { method: 'PUT', body: updatedData });
            showToast("Medicine updated successfully!");
            closeEditModal();
            loadMedicines();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
    
    async function deleteMedicine(id, name) {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                await apiFetch(`/medicines/${id}`, { method: 'DELETE' });
                showToast("Medicine deleted.");
                loadMedicines();
            } catch (err) {
                showToast(err.message, 'error');
            }
        }
    }

    // --- INITIAL LOAD ---
    loadMedicines();
});