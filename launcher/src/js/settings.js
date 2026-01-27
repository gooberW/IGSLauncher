document.addEventListener("DOMContentLoaded", async () => {
    const root = document.documentElement;
    const clearActiveTheme = () => {
        localStorage.setItem("activeTheme", "custom");
        document.querySelectorAll(".theme-btn")
            .forEach(b => b.classList.remove("active"));
    };

    const data = await window.electronAPI.getThemes();
    const themes = data.themes || {};

    if (!themes.default) {
        console.error("[Settings] No 'default' theme found.");
        return;
    }

    const applyTheme = themeName => {
        const theme = themes[themeName];
        if (!theme) return;

        Object.entries(theme).forEach(([key, value]) => {
            const cssVar = `--${key}`;

            root.style.setProperty(cssVar, value);
            localStorage.setItem(cssVar, value);

            const input = document.querySelector(
                `input[type="color"][data-var="${cssVar}"]`
            );
            if (input) input.value = value;

            const resetBtn = document.querySelector(
                `.reset-btn[data-var="${cssVar}"]`
            );
            if (resetBtn) {
                resetBtn.disabled = value === themes.default[key];
            }
        });
    };

    Object.keys(themes.default).forEach(key => {
        const cssVar = `--${key}`;
        const storedValue = localStorage.getItem(cssVar);

        if (storedValue) {
            root.style.setProperty(cssVar, storedValue);

            const input = document.querySelector(
                `input[type="color"][data-var="${cssVar}"]`
            );
            if (input) input.value = storedValue;

            const resetBtn = document.querySelector(
                `.reset-btn[data-var="${cssVar}"]`
            );
            if (resetBtn) {
                resetBtn.disabled = storedValue === themes.default[key];
            }
        }
    });

    const activeTheme = localStorage.getItem("activeTheme");
    if (activeTheme && themes[activeTheme] && activeTheme !== "custom") {
        applyTheme(activeTheme);
        const btn = document.querySelector(
            `.theme-btn[data-theme="${activeTheme}"]`
        );
        if (btn) btn.classList.add("active");
    }

    document.querySelectorAll('input[type="color"][data-var]').forEach(input => {
        const cssVar = input.dataset.var;
        const key = cssVar.replace("--", "");
        const resetBtn = document.querySelector(
            `.reset-btn[data-var="${cssVar}"]`
        );

        input.addEventListener("input", e => {
            const value = e.target.value;

            root.style.setProperty(cssVar, value);
            localStorage.setItem(cssVar, value);

            clearActiveTheme();

            if (resetBtn) {
                resetBtn.disabled = value === themes.default[key];
            }
        });
    });

    document.querySelectorAll(".reset-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const cssVar = btn.dataset.var;
            const key = cssVar.replace("--", "");
            const defaultValue = themes.default[key];

            root.style.setProperty(cssVar, defaultValue);
            localStorage.setItem(cssVar, defaultValue);

            clearActiveTheme();

            const input = document.querySelector(
                `input[type="color"][data-var="${cssVar}"]`
            );
            if (input) input.value = defaultValue;

            btn.disabled = true;
        });
    });

    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const themeName = btn.dataset.theme;
            if (!themes[themeName]) return;

            applyTheme(themeName);
            localStorage.setItem("activeTheme", themeName);

            document.querySelectorAll(".theme-btn")
                .forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    const homeBtn = document.getElementById("homeBtn");
    if (homeBtn) {
        homeBtn.addEventListener("click", () => {
            window.electronAPI.changePage("index.html");
        });
    }
});
