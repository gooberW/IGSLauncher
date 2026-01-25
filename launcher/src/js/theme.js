(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);

    if (!localStorage.getItem("__theme_defaults__")) {
        const defaults = {};
        styles.cssText?.split(";").forEach(() => {});

        document.documentElement.style.cssText;

        document.querySelectorAll('[data-var]').forEach(el => {
            const cssVar = el.dataset.var;
            defaults[cssVar] = styles.getPropertyValue(cssVar).trim();
        });

        localStorage.setItem("__theme_defaults__", JSON.stringify(defaults));
    }

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("--")) {
            root.style.setProperty(key, localStorage.getItem(key));
        }
    }
})();
