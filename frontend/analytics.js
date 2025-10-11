document.addEventListener('DOMContentLoaded', () => {
    // --- Chart.js Custom Plugin to draw text in the middle ---
    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: function (chart) {
            // Check if there is actual data to prevent error on empty chart (where data is [1, 0] for a grey ring)
            if (!chart.data.datasets || chart.data.datasets[0].data.length === 0) return;
            
            const ctx = chart.ctx;
            const width = chart.width;
            const height = chart.height;
            
            ctx.restore();
            // Calculate font size based on height to make it responsive
            const fontSize = Math.max(20, Math.min(height / 6, 40)); 
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            ctx.textBaseline = "middle";
            
            // Get the text from the summary section
            const text = document.getElementById('stat-percent').textContent;
            const textWidth = ctx.measureText(text).width;
            const textX = Math.round((width - textWidth) / 2);
            const textY = height / 2; // Center vertically
            
            ctx.fillStyle = '#e2e0ee'; // Use main text color
            ctx.fillText(text, textX, textY);
            ctx.save();
        }
    };

    let adherenceChart = null;

    // Helper to format date strings for the History table (e.g., '2025-10-10' -> 'Oct 10, 2025')
    function formatDate(dateString) {
        if (!dateString) return '';
        // Input is YYYY-MM-DD string, output is localized date
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function renderChart(taken, missed) {
        const ctx = document.getElementById('adherenceChart').getContext('2d');
        
        const total = taken + missed;
        // If total is 0, show a solid grey ring with 1 unit of data to visually indicate 0% adherence
        const chartData = total > 0 ? [taken, missed] : [1, 0]; 
        const backgroundColors = total > 0 ? ['#10b981', '#ef4444'] : ['#2d2a3d', 'transparent'];

        const data = {
            labels: ['Taken', 'Missed'],
            datasets: [{
                data: chartData,
                backgroundColor: backgroundColors,
                borderColor: '#1a1724', // Matches the card background for a nice effect
                borderWidth: 4,
                hoverOffset: 8
            }]
        };

        if (adherenceChart) {
            adherenceChart.data = data;
            adherenceChart.options.plugins.tooltip.enabled = total > 0; // Update tooltip status
            adherenceChart.update();
            return;
        }

        adherenceChart = new Chart(ctx, {
            type: 'doughnut',
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allows the chart to fill the container height
                cutout: '70%',
                plugins: {
                    legend: { 
                        display: false 
                    },
                    tooltip: { 
                        enabled: total > 0, // Enable tooltip only if there is data
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed;
                                    const totalCount = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = totalCount > 0 ? ((context.parsed / totalCount) * 100).toFixed(1) : 0;
                                    label += ` (${percentage}%)`;
                                }
                                return label;
                            }
                        }
                    },
                }
            },
            plugins: [centerTextPlugin] // Register the custom plugin
        });
    }

    function renderDaily(daily) {
        const container = document.getElementById('recent-list');
        if (!daily || daily.length === 0) {
            container.innerHTML = '<div class="empty">No adherence records in the selected range.</div>';
            return;
        }

        // Generate table HTML
        const tableBody = daily.map(d => `
            <tr>
                <td>${formatDate(d.date)}</td>
                <td>${d.total}</td>
                <td>${d.taken}</td>
                <td>${d.missed}</td>
            </tr>
        `).join('');
        
        container.innerHTML = `
            <table class="daily-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th style="text-align: right;">Total</th>
                        <th style="text-align: right;">Taken</th>
                        <th style="text-align: right;">Missed</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableBody}
                </tbody>
            </table>
        `;
    }

    // Function to reset all displayed stats
    function resetStats(errorMessage = null) {
        document.getElementById('stat-total').textContent = 0;
        document.getElementById('stat-taken').textContent = 0;
        document.getElementById('stat-missed').textContent = 0;
        document.getElementById('stat-percent').textContent = '0%';
        renderChart(0, 0); // Render an empty chart
        document.getElementById('recent-list').innerHTML = errorMessage ? 
            `<p class="error-message">${errorMessage}</p>` : 
            '<div class="empty">Select a date range and click Apply.</div>';
    }


    async function loadAnalytics(startDate, endDate) {
        const token = localStorage.getItem("token");

        // 1. Initial check for missing token (BEFORE network request)
        if (!token) {
            resetStats('Authentication required. Redirecting to login...');
            setTimeout(() => {
                window.location.href = 'login.html'; 
            }, 1500);
            return;
        }

        // Simple validation
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            alert("Start date cannot be after end date.");
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/analytics/data', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ startDate, endDate }),
            });

            // 2. Critical check for 401 Unauthorized error (AFTER network request)
            if (res.status === 401) {
                // Display error and redirect
                resetStats('Error fetching data: Unauthorized. Session expired. Redirecting to login...');
                
                // Clear the invalid token (good practice)
                localStorage.removeItem("token");
                
                setTimeout(() => {
                    window.location.href = 'login.html'; // Redirect the user to log in again
                }, 1500);
                return; 
            }

            if (!res.ok) {
                // Handle other non-401 HTTP errors (e.g., 500 server error)
                throw new Error(`Server responded with status ${res.status}.`);
            }
            
            const json = await res.json();
            
            // Use default values to prevent errors
            const { total = 0, taken = 0, missed = 0, adherenceRate = 0, daily = [] } = json;

            // Update Summary Stats
            document.getElementById('stat-total').textContent = total;
            document.getElementById('stat-taken').textContent = taken;
            document.getElementById('stat-missed').textContent = missed;
            // Round adherence rate to nearest whole number
            document.getElementById('stat-percent').textContent = Math.round(adherenceRate) + '%';

            // Update UI components
            renderChart(taken, missed);
            renderDaily(daily);

        } catch (err) {
            console.error('Analytics Fetch Error:', err);
            // Use the resetStats function to clear data and show error message
            resetStats(`Error fetching data: ${err.message}`);
        }
    }

    // --- EVENT LISTENERS ---
    document.getElementById('fetchRange').addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        // Use null for empty string dates, allowing the backend to use its default range if needed
        loadAnalytics(startDate || null, endDate || null); 
    });
    
    // --- INITIAL LOAD ---
    // On page load, fetch data for the last 7 days by default.
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    
    // Format dates to YYYY-MM-DD for the input fields
    const formatDateForInput = (date) => date.toISOString().split('T')[0];

    const startDateDefault = formatDateForInput(weekAgo);
    const endDateDefault = formatDateForInput(today);

    // Set the default values in the input fields
    document.getElementById('startDate').value = startDateDefault;
    document.getElementById('endDate').value = endDateDefault;

    // Load initial data
    loadAnalytics(startDateDefault, endDateDefault);
});