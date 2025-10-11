document.addEventListener("DOMContentLoaded", () => {
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
    
    // Initial token check and authentication guard
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("No token found. Redirecting to login.");
        // We use a small delay to ensure the error message is briefly visible
        setTimeout(() => {
            window.location.href = 'login.html'; 
        }, 500);
        
        if (addMedicineForm) {
            addMedicineForm.style.opacity = '0.5';
            addMedicineForm.style.pointerEvents = 'none';
        }
        return;
    }

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

    // --- NOTIFICATION SYSTEM (MODAL/TOAST) ---
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

    // --- HELPER & API FUNCTIONS ---

    /**
     * NEW: Formats a YYYY-MM-DD string to DD-MM-YYYY for display.
     * @param {string} dateString - Date in 'YYYY-MM-DD' format.
     * @returns {string} - Date in 'DD-MM-YYYY' format.
     */
    function formatDateForDisplay(dateString) {
        if (!dateString) return '';
        // Assuming dateString is always 'YYYY-MM-DD' from the backend/input[type=date]
        const parts = dateString.split('-');
        if (parts.length === 3) {
            // parts[0]=YYYY, parts[1]=MM, parts[2]=DD
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateString; // Return original if format is unexpected
    }

    function escapeHtml(str) {
        if (!str && str !== 0) return "";
        return String(str)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // *** UPDATED: Sends token in the Authorization Header ***
    const apiFetch = async (url, options = {}) => {
        const { body, method = 'POST', ...otherOptions } = options;
        
        const requestOptions = {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                // CRITICAL FIX: Send token in the Authorization Header
                'Authorization': `Bearer ${token}` 
            },
            body: body ? JSON.stringify(body) : undefined, // Only include body if present
            ...otherOptions
        };

        const res = await fetch(`http://localhost:5000/api${url}`, requestOptions);
        
        // Handle 401 response explicitly
        if (res.status === 401) {
            localStorage.removeItem('token');
            showToast('Session expired. Redirecting...', 'error');
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

    // --- CORE DATA FUNCTIONS ---
    async function loadMedicines(highlightId = null) {
        try {
            // Need to send the selected date for the server to attach adherence status
            // Assuming default today's date for this page load if no date picker is used
            const today = new Date().toISOString().split('T')[0]; 
            const selectedDate = document.getElementById('schedule-date')?.value || today; 
            
            // Pass the selectedDate in the request body
            allMedicines = await apiFetch('/medicines/list', { body: { selectedDate } }) || [];
            
            filterAndRenderMedicines();
            
            if (highlightId) {
                const itemToHighlight = document.querySelector(`[data-id='${highlightId}']`);
                if (itemToHighlight) {
                    itemToHighlight.classList.add('medicine-item--highlighted');
                    setTimeout(() => itemToHighlight.classList.remove('medicine-item--highlighted'), 2500);
                }
            }
        } catch (err) {
            if (err.message !== "Unauthorized") {
                showToast(err.message, 'error');
            }
        }
    }

    // --- RENDER, SORT, AND FILTER LOGIC (UNCHANGED) ---
    const filterAndRenderMedicines = () => {
        let medicinesToRender = [...allMedicines];
        const searchTerm = searchBar.value.toLowerCase();
        const sortValue = sortBy.value;

        if (searchTerm) {
            medicinesToRender = medicinesToRender.filter(med => med.name.toLowerCase().includes(searchTerm));
        }

        const getEarliestTime = (times) => {
            if (!times || times.length === 0) return new Date('2000-01-01T23:59:59');
            const dateObjects = times.map(t => new Date(`1970/01/01 ${t}`));
            return new Date(Math.min.apply(null, dateObjects));
        };

        const getLatestTime = (times) => {
            if (!times || times.length === 0) return new Date('1970/01/01 00:00:00');
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
            medicinesList.innerHTML = "<p class='text-muted' style='text-align:center; padding: 20px;'>No medicines found. Add one above!</p>";
            return;
        }
        medicines.forEach(med => {
            const item = document.createElement("div");
            item.className = "medicine-item";
            item.dataset.id = med._id;

            const timesDisplay = Array.isArray(med.times) ? med.times.join(', ') : '';
            
            // --- FIX APPLIED HERE ---
            const displayStartDate = formatDateForDisplay(med.startDate);
            const displayEndDate = formatDateForDisplay(med.endDate);

            item.innerHTML = `
                <div class="medicine-content">
                    <h3>${escapeHtml(med.name)}</h3>
                    <p>Dosage: ${escapeHtml(med.dosage)}</p>
                    <p>Time(s): ${escapeHtml(timesDisplay)}</p>
                    <p>Duration: ${escapeHtml(displayStartDate)} to ${escapeHtml(displayEndDate)}</p>
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
        document.getElementById('edit-reminder-email').value = med.email || '';
        document.getElementById('edit-start-date').value = med.startDate;
        document.getElementById('edit-end-date').value = med.endDate;

        const dosageParts = med.dosage.split(' ');
        document.getElementById('edit-dosage-amount').value = dosageParts[0];
        document.getElementById('edit-dosage-unit').value = dosageParts.slice(1).join(' ');

        editTimeInputsContainer.innerHTML = '';
        med.times.forEach(time => {
            const group = document.createElement('div');
            group.className = 'time-input-group';
            group.innerHTML = `<input type="time" class="medicine-time" value="${time}" required><button type="button" class="btn-remove-time">&times;</button>`;
            group.querySelector('.btn-remove-time').addEventListener('click', (e) => e.target.parentElement.remove());
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

    // --- ADD MEDICINE ---
    addMedicineForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById("medicine-name").value,
            email: document.getElementById("reminder-email").value,
            phone: document.getElementById("reminder-phone").value,
            startDate: document.getElementById("start-date").value,
            endDate: document.getElementById("end-date").value,
            dosage: `${document.getElementById("dosage-amount").value} ${document.getElementById("dosage-unit").value}`,
            times: Array.from(document.querySelectorAll('#time-inputs-container .medicine-time'))
                .map(input => input.value)
                .filter(Boolean)
        };
        if (formData.times.length === 0) { showToast("Please add at least one time.", "error"); return; }
        try {
            const addedMedicine = await apiFetch('/medicines/add', { body: formData });
            showToast("Medicine added successfully!");
            addMedicineForm.reset();
            // Reset time inputs, keeping only the first one if necessary
            while (timeInputsContainer.children.length > 1) {
                timeInputsContainer.removeChild(timeInputsContainer.lastChild);
            }
            document.querySelector('#time-inputs-container .medicine-time').value = '';

            loadMedicines(addedMedicine._id);
        } catch (err) {
            if (err.message !== "Unauthorized") {
                showToast(err.message, 'error');
            }
        }
    });

    // --- EDIT MEDICINE ---
    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-medicine-id').value;
        const updatedData = {
            name: document.getElementById("edit-medicine-name").value,
            email: document.getElementById("edit-reminder-email").value,
            startDate: document.getElementById("edit-start-date").value,
            endDate: document.getElementById("edit-end-date").value,
            dosage: `${document.getElementById("edit-dosage-amount").value} ${document.getElementById("edit-dosage-unit").value}`,
            times: Array.from(document.querySelectorAll('#edit-time-inputs-container .medicine-time'))
                .map(input => input.value)
                .filter(Boolean)
        };
        if (updatedData.times.length === 0) { showToast("Please add at least one time.", "error"); return; }
        try {
            // Note: We specify method: 'PUT' here, which is handled in the apiFetch options via ...otherOptions
            await apiFetch(`/medicines/${id}`, { method: 'PUT', body: updatedData }); 
            showToast("Medicine updated successfully!");
            closeEditModal();
            loadMedicines(id);
        } catch (err) {
            if (err.message !== "Unauthorized") {
                showToast(err.message, 'error');
            }
        }
    });

    // --- DELETE MEDICINE ---
    async function deleteMedicine(id, name) {
        // NOTE: Replacing confirm() with a custom modal is best practice in modern apps
        if (window.confirm(`Are you sure you want to delete ${name}?`)) { 
            try {
                // Note: We specify method: 'DELETE' here
                await apiFetch(`/medicines/${id}`, { method: 'DELETE' }); 
                showToast("Medicine deleted.");
                loadMedicines();
            } catch (err) {
                if (err.message !== "Unauthorized") {
                    showToast(err.message, 'error');
                }
            }
        }
    }

    // --- INITIAL LOAD ---
    loadMedicines();
});
