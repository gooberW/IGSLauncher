document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);

    // cache default values
    const defaultTheme = {};
    document.querySelectorAll('input[type="color"][data-var]')
        .forEach(input => {
            const cssVar = input.dataset.var;
            defaultTheme[cssVar] = styles.getPropertyValue(cssVar).trim();
        });

    // restores saved values
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith("--")) {
            root.style.setProperty(key, localStorage.getItem(key));
        }
    });

    // color pickers and stuff
    document.querySelectorAll('input[type="color"][data-var]')
        .forEach(input => {
            const cssVar = input.dataset.var;
            const resetBtn = document.querySelector(
                `.reset-btn[data-var="${cssVar}"]`
            );

            // fills picker from current value
            input.value = getComputedStyle(root)
                .getPropertyValue(cssVar)
                .trim();

            // disables reset button if already default
            if (resetBtn) {
                resetBtn.disabled = input.value === defaultTheme[cssVar];
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

    // reset buttons
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
