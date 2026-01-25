document.addEventListener("DOMContentLoaded", async () => {
    const root = document.documentElement;

    const clearActiveTheme = () => {
        localStorage.removeItem("activeTheme");
        document.querySelectorAll(".theme-btn")
            .forEach(b => b.classList.remove("active"));
    };

    const data = await window.electronAPI.getThemes();
    const themes = data.themes || {};

    if (!themes["default"]) {
        console.error("[Settings] No 'default' theme found in themes JSON.");
        return;
    }

    const applyTheme = themeName => {
        const theme = themes[themeName];
        if (!theme) return;

        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
            localStorage.setItem(`--${key}`, value);

            // color inputs
            const input = document.querySelector(`input[type="color"][data-var="--${key}"]`);
            if (input) input.value = value;

            // reset buttons
            const resetBtn = document.querySelector(`.reset-btn[data-var="--${key}"]`);
            if (resetBtn && themes["default"][key] !== undefined) {
                resetBtn.disabled = value === themes["default"][key];
            }
        });
    };

    document.querySelectorAll('input[type="color"][data-var]').forEach(input => {
        const cssVar = input.dataset.var;
        const key = cssVar.replace("--", "").trim();
        const resetBtn = document.querySelector(`.reset-btn[data-var="${cssVar}"]`);

        const storedValue = (localStorage.getItem(cssVar) || getComputedStyle(root).getPropertyValue(cssVar)).trim();
        input.value = storedValue;
        root.style.setProperty(cssVar, storedValue);

        if (themes["default"][key] !== undefined && resetBtn) {
            resetBtn.disabled = storedValue === themes["default"][key];
        }

        input.addEventListener("input", e => {
            const value = e.target.value.trim();
            root.style.setProperty(cssVar, value);
            localStorage.setItem(cssVar, value);

            clearActiveTheme();

            if (themes["default"][key] !== undefined && resetBtn) {
                resetBtn.disabled = value === themes["default"][key];
            }
        });
    });

    document.querySelectorAll(".reset-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const cssVar = btn.dataset.var;
            const key = cssVar.replace("--", "").trim();
            const defaultValue = themes["default"][key];
            if (!defaultValue) return;

            root.style.setProperty(cssVar, defaultValue);
            localStorage.removeItem(cssVar);

            clearActiveTheme();

            const input = document.querySelector(`input[type="color"][data-var="${cssVar}"]`);
            if (input) input.value = defaultValue;

            btn.disabled = true;
        });
    });

    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const themeName = btn.dataset.theme;
            if (!themeName || !themes[themeName]) return;

            applyTheme(themeName);

            localStorage.setItem("activeTheme", themeName);

            document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });


    document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));

    const savedTheme = localStorage.getItem("activeTheme") || "default";

    if (themes[savedTheme]) {
        applyTheme(savedTheme);
        const btn = document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`);
        if (btn) btn.classList.add("active");
    }

    if (savedTheme) {
        applyTheme(savedTheme);
        const btn = document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`);
        if (btn) btn.classList.add("active");
    }



    const homeBtn = document.getElementById("homeBtn");
    homeBtn.addEventListener("click", () => {
        window.electronAPI.changePage("index.html");
    });
});


