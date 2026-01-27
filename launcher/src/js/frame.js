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
        ? `<div class="icon icon-restore"></div>`
        : `<div class="icon icon-maximize"></div>`;
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