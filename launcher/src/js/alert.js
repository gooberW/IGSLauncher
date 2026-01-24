export function showAlert(message) {
    document.getElementById("alert-message").innerText = message;
    document.getElementById("alert").classList.add("active");
    document.getElementById("alert-ok").addEventListener("click", closeAlert);
    document.getElementById("alert-cancel").hidden = true;
    document.getElementById("alert-close").addEventListener("click", closeAlert);
}

export function showConfirmation(message) {
    return new Promise((resolve) => {
        document.getElementById("alert-message").innerText = message;
        document.getElementById("alert").classList.add("active");
        document.getElementById("alert-cancel").hidden = false;

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
