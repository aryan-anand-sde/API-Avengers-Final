document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem("token");

    // --- Chart.js Custom Plugin to draw text in the middle ---
    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: function (chart) {
            if (chart.data.datasets[0].data.length === 0) return;
            const ctx = chart.ctx;
            const width = chart.width;
            const height = chart.height;
            
            ctx.restore();
            const fontSize = (height / 114).toFixed(2);
            ctx.font = `bold ${fontSize}rem Inter, sans-serif`;
            ctx.textBaseline = "middle";
            
            const text = document.getElementById('stat-percent').textContent;
            const textX = Math.round((width - ctx.measureText(text).width) / 2);
            const textY = height / 1.9; // Adjust vertical position
            
            ctx.fillStyle = '#e2e0ee'; // Use main text color
            ctx.fillText(text, textX, textY);
            ctx.save();
        }
    };

    let adherenceChart = null;
    function renderChart(taken, missed) {
        const ctx = document.getElementById('adherenceChart').getContext('2d');
        const data = {
            labels: ['Taken', 'Missed'],
            datasets: [{
                data: [taken, missed],
                backgroundColor: ['#10b981', '#ef4444'],
                borderColor: '#1a1724', // Matches the card background for a nice effect
                borderWidth: 4,
                hoverOffset: 8
            }]
        };

        if (adherenceChart) {
            adherenceChart.data = data;
            adherenceChart.update();
            return;
        }

        adherenceChart = new Chart(ctx, {
            type: 'doughnut',
            data,
            options: {
                cutout: '70%',
                plugins: {
                    legend: { 
                        display: false 
                    },
                    tooltip: { 
                        enabled: true 
                    },
                }
            },
            plugins: [centerTextPlugin] // Register the custom plugin
        });
    }

    function renderDaily(daily) {
        const container = document.getElementById('recent-list');
        if (!daily || daily.length === 0) {
            container.innerHTML = '<div class="empty">No records in selected range</div>';
            return;
        }
        // This assumes you have a .daily-table style in dashboard.css
        container.innerHTML = `<table class="daily-table"><thead><tr><th>Date</th><th>Total</th><th>Taken</th><th>Missed</th></tr></thead><tbody>${daily.map(d => `<tr><td>${d.date}</td><td>${d.total}</td><td>${d.taken}</td><td>${d.missed}</td></tr>`).join('')}</tbody></table>`;
    }

    async function loadAnalytics(startDate, endDate) {
        try {
            const res = await fetch('http://localhost:5000/api/analytics/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, startDate, endDate }),
            });

            if (!res.ok) throw new Error('Failed to fetch analytics from the server.');
            const json = await res.json();
            
            // Use default values to prevent errors if the backend response is incomplete
            const { total = 0, taken = 0, missed = 0, adherenceRate = 0, daily = [] } = json;

            document.getElementById('stat-total').textContent = total;
            document.getElementById('stat-taken').textContent = taken;
            document.getElementById('stat-missed').textContent = missed;
            document.getElementById('stat-percent').textContent = Math.round(adherenceRate) + '%';

            renderChart(taken, missed);
            renderDaily(daily);
        } catch (err) {
            console.error(err);
            document.getElementById('recent-list').innerHTML = `<p class="error-message">${err.message}</p>`;
        }
    }

    // --- EVENT LISTENERS ---
    document.getElementById('fetchRange').addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value || null;
        const endDate = document.getElementById('endDate').value || null;
        loadAnalytics(startDate, endDate);
    });
    
    // --- INITIAL LOAD ---
    // On page load, fetch data for the last 7 days by default.
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    
    // Format dates to YYYY-MM-DD for the input fields
    const startDateDefault = weekAgo.toISOString().split('T')[0];
    const endDateDefault = today.toISOString().split('T')[0];

    document.getElementById('startDate').value = startDateDefault;
    document.getElementById('endDate').value = endDateDefault;

    loadAnalytics(startDateDefault, endDateDefault);
});

