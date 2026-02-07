import { showAlert, showConfirmation } from "./alert.js";
import { displayGames, closeSidebar } from "./renderer.js";

let editingGame = null; // null = add mode, otherwise stores { id, data }

/**
 * Writes the game data from the add game window to the library.
 * If the game name or path is empty, it will display an alert and return.
 * If the write is successful, it will display an alert and update the game list.
 * @throws {Error} If there is an error writing the game data.
 */
async function writeGameData() {
    const title = document.getElementById('title').value.trim();
    const path = document.getElementById('exePathDisplay').value;
    const coverImage = document.getElementById('coverPathDisplay').value;
    const icon = document.getElementById('iconPathDisplay').value;
    const description = document.getElementById('descriptionArea').value;

    const tags = Array.from(
        document.getElementById('tag-container').children
    ).map(tag => tag.textContent.trim());

    if (!title || !path) {
        showAlert("The game needs a title and a path.");
        return;
    }

    const gameData = {
        title,
        path,
        coverImage,
        icon,
        tags,
        description
    };

    try {
        let result;

        if (editingGame) {
            result = await window.electronAPI.updateGame(
                editingGame.id,
                gameData
            );
        } else {
            result = await window.electronAPI.writeGameData({
                details: gameData
            });
        }

        if (result.success) {
            let alertMessage = editingGame ? "Game updated successfully." : "Game added successfully.";
            showAlert(alertMessage);
            displayGames();
            closeSidebar();
            closeAddGame();
            resetForm();
            editingGame = null;
        }else {
            console.error(result.error);
            showAlert(result.error);
        }
    } catch (err) {
        console.error(err);
    }
}




/**
 * Adds a new tag to the list of tags in the add game window.
 * When a tag is clicked, it is removed from the list.
 */
function addTag() {
    const tagInput = document.getElementById('tag');
    const tagContainer = document.getElementById('tag-container');
    const tagValue = tagInput.value.trim();

    if (tagValue === "") return;

    const tag = document.createElement('p');
    tag.className = 'tag';
    tag.innerText = tagValue;
    tagContainer.appendChild(tag);
    tagInput.value = '';

    tag.addEventListener('click', () => {
        tagContainer.removeChild(tag);
    });
}

/**
 * Opens the add game window.
 */
function openAddGame() {
    const addGameWindow = document.querySelector('.add-game-window');
    if (addGameWindow) addGameWindow.classList.add('active');
}

export function openEditGame(gameID, gameData) {
    editingGame = { id: gameID, data: gameData };

    document.getElementById('addGameTitle').innerText = "Edit Game";

    document.getElementById('title').value = gameData.title || "";
    document.getElementById('exePathDisplay').value = gameData.path || "";
    document.getElementById('coverPathDisplay').value = gameData.coverImage || "";
    document.getElementById('iconPathDisplay').value = gameData.icon || "";
    document.getElementById('descriptionArea').value = gameData.description || "";

    const addGameBtn = document.getElementById('add-game-button');
    addGameBtn.innerText = "Save Changes";
    const tagContainer = document.getElementById('tag-container');
    tagContainer.innerHTML = "";

    (gameData.tags || []).forEach(tagText => {
        const tag = document.createElement('p');
        tag.className = 'tag';
        tag.innerText = tagText;

        tag.addEventListener('click', () => {
            tagContainer.removeChild(tag);
        });

        tagContainer.appendChild(tag);
    });

    openAddGame();
}


/**
 * Closes the add game window.
 */
function closeAddGame() {
    const addGameWindow = document.querySelector('.add-game-window');
    if (addGameWindow) addGameWindow.classList.remove('active');
    resetForm();
    editingGame = null;
}

function resetForm() {
    document.getElementById('title').value = "";
    document.getElementById('exePathDisplay').value = "";
    document.getElementById('coverPathDisplay').value = "";
    document.getElementById('iconPathDisplay').value = "";
    document.getElementById('descriptionArea').value = "";
    document.getElementById('tag-container').innerHTML = "";

    document.getElementById('addGameTitle').innerText = "Add Game";

    const addGameBtn = document.getElementById('add-game-button');
    addGameBtn.innerText = "Add Game";
}


// Event Listeners -----------

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addTag').addEventListener('click', addTag);

    document.getElementById('add-game-button').addEventListener('click', () => {
        writeGameData();
    });

    const selectExeBtn = document.getElementById('selectExeBtn');
    const exePathDisplay = document.getElementById('exePathDisplay');

    selectExeBtn.addEventListener('click', async () => {
        const filePath = await window.electronAPI.selectExecutable();
        if (filePath) {
            exePathDisplay.value = filePath;
        }
    });

    document.getElementById('selectCoverBtn').addEventListener('click', async () => {
        const filePath = await window.electronAPI.selectImage();
        if (filePath) {
            document.getElementById('coverPathDisplay').value = filePath;
        }
    });

    document.getElementById('selectIconBtn').addEventListener('click', async () => {
        const filePath = await window.electronAPI.selectImage();
        if (filePath) {
            document.getElementById('iconPathDisplay').value = filePath;
        }
    });
    
    const addGameBtn = document.getElementById('add-game-menu-button');
    const closeBtn = document.getElementById('closeAddGame');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAddGame);
    }
    
    if (addGameBtn) {
        addGameBtn.addEventListener('click', openAddGame);
    }
});