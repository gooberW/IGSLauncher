export function showAlert(message) {
    document.getElementById("alert-message").innerText = message;
    document.getElementById("alert").classList.add("active");
    document.getElementById("alert-ok").addEventListener("click", closeAlert);
    document.getElementById("alert-cancel").hidden = true;
    document.getElementById("alert-close").addEventListener("click", closeAlert);

    centerAlertWindow();
}

export function showConfirmation(message) {
    return new Promise((resolve) => {
        document.getElementById("alert-message").innerText = message;
        document.getElementById("alert").classList.add("active");
        document.getElementById("alert-cancel").hidden = false;
        centerAlertWindow();

        const closeBtn = document.getElementById("alert-close");
        const okBtn = document.getElementById("alert-ok");
        const cancelBtn = document.getElementById("alert-cancel");

        function cleanup(result) {
            closeAlert();
            okBtn.removeEventListener("click", onOk);
            cancelBtn.removeEventListener("click", onCancel);
            resolve(result);
        }

        function onOk() {
            cleanup(true);
        }

        function onCancel() {
            cleanup(false);
        }

        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);
        closeBtn.addEventListener("click", onCancel);
    });
}

function closeAlert() {
    document.getElementById("alert").classList.remove("active");
}

function centerAlertWindow() {
    const alertWindow = document.getElementById("alert");
    const rect = alertWindow.getBoundingClientRect();
    alertWindow.style.left = `${(window.innerWidth - rect.width) / 2}px`;
    alertWindow.style.top = `${(window.innerHeight - rect.height) / 2}px`;
}


const alertWindow = document.getElementById("alert");
const dragHandle = alertWindow.querySelector(".drag-bar");

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

dragHandle.addEventListener("mousedown", (e) => {
    isDragging = true;

    const rect = alertWindow.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    document.body.style.userSelect = "none";
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    alertWindow.style.left = `${e.clientX - offsetX}px`;
    alertWindow.style.top = `${e.clientY - offsetY}px`;
});

document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
});

