document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const defaultTheme = {
        "--main-bg-color": "#EDEDF5",
        "--secondary-color": "#050522",
        "--accent-color": "#E6192A",
        "--text-color": "#050522"
    };

    document.querySelectorAll('input[type="color"][data-var]')
        .forEach(input => {
            const cssVar = input.dataset.var;
            const resetBtn = document.querySelector(
                `.reset-btn[data-var="${cssVar}"]`
            );

            const currentValue = getComputedStyle(root)
                .getPropertyValue(cssVar)
                .trim();

            input.value = currentValue;

            if (resetBtn) {
                resetBtn.disabled = currentValue === defaultTheme[cssVar];
            }

            input.addEventListener("input", e => {
                const value = e.target.value;

                root.style.setProperty(cssVar, value);
                localStorage.setItem(cssVar, value);

                if (resetBtn) {
                    resetBtn.disabled = value === defaultTheme[cssVar];
                }
            });
        });

    document.querySelectorAll(".reset-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const cssVar = btn.dataset.var;
            const defaultValue = defaultTheme[cssVar];

            if (!defaultValue) return;

            root.style.setProperty(cssVar, defaultValue);
            localStorage.removeItem(cssVar);

            const input = document.querySelector(
                `input[type="color"][data-var="${cssVar}"]`
            );
            if (input) {
                input.value = defaultValue;
            }

            btn.disabled = true;
        });
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                window.electronAPI.changePage('index.html');
            });
        }

        console.log("Home button:", homeBtn);
});
