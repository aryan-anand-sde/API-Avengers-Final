document.addEventListener('DOMContentLoaded', () => {
    // --- Sparkle Animation (runs on both pages) ---
    const sparkleContainer = document.getElementById('sparkle-container');
    if (sparkleContainer) {
        const sparkleCount = 70;

        const createSparkle = () => {
            const sparkle = document.createElement('div');
            sparkle.classList.add('sparkle');
            
            sparkle.style.top = `${Math.random() * 100}%`;
            sparkle.style.left = `${Math.random() * 100}%`;
            
            const duration = Math.random() * 1.8 + 1.2;
            const delay = Math.random() * 2.5;
            sparkle.style.animationDuration = `${duration}s`;
            sparkle.style.animationDelay = `${delay}s`;

            const size = Math.random() * 2.5 + 1;
            sparkle.style.width = `${size}px`;
            sparkle.style.height = `${size}px`;

            sparkleContainer.appendChild(sparkle);
        };

        for (let i = 0; i < sparkleCount; i++) {
            createSparkle();
        }
    }

    // --- Auth Page Tab Logic (only runs if auth elements exist) ---
    const authTabsContainer = document.querySelector('.auth-tabs');
    if (authTabsContainer) {
        const tabLinks = authTabsContainer.querySelectorAll('.tab-link');
        const authForms = document.querySelectorAll('.auth-form');

        tabLinks.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                // Update active tab link
                tabLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.dataset.tab === targetTab) {
                        link.classList.add('active');
                    }
                });

                // Update active form
                authForms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${targetTab}-form`) {
                        form.classList.add('active');
                    }
                });
            });
        });
    }
});