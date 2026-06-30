function closeApp() {
    window.electronAPI.closeApp();
}

function minimizeApp() {
    window.electronAPI.minimizeApp();
}

const maximizeBtn = document.getElementById("maximizeBtn");

async function toggleMaximize() {
    const isMaximized = await window.electronAPI.toggleMaximize();

    maximizeBtn.innerHTML = isMaximized
        ? `<i class="bi bi-copy" style="transform: rotate(180deg);"></i>`
        : `<i class="bi bi-square"></i>`;
}


document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeBtn');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const maximizeBtn = document.getElementById('maximizeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeApp);
    }
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', minimizeApp);
    }
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', toggleMaximize);
    }
});