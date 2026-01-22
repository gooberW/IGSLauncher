async function writeGameData() {
    const nameInput = document.getElementById('name');
    const pathInput = document.getElementById('exePathDisplay');
    const coverInput = document.getElementById('coverPathDisplay');
    const iconInput = document.getElementById('iconPathDisplay');
    const tagsContainer = document.getElementById('tag-container');
    const descInput = document.getElementById('descriptionArea');

    const tags = Array.from(tagsContainer.children).map(tag => tag.textContent.trim());
    
    const gameData = {
        name: nameInput.value,
        details: {
            path: pathInput.value,
            coverImage: coverInput.value,
            icon: iconInput.value,
            tags: tags,
            description: descInput ? descInput.value : ""
        }
    };

    if (!gameData.name || !gameData.details.path) {
        alert("The game needs a name and a path.");
        return;
    }

    try {
        const result = await window.electronAPI.writeGameData(gameData);
        if (result.success) {
            alert("Game added successfully.");
            displayGames();
        }
    } catch (error) {
        console.error("Error writing game data:", error);
    }
}


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

function openAddGame() {
    const addGameWindow = document.querySelector('.add-game-window');
    if (addGameWindow) addGameWindow.classList.add('active');
}

function closeAddGame() {
    const addGameWindow = document.querySelector('.add-game-window');
    if (addGameWindow) addGameWindow.classList.remove('active');
}

document.getElementById('addTag').addEventListener('click', addTag);
document.getElementById('add-game-button').addEventListener('click', writeGameData);

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

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeAddGame');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAddGame);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const addGameBtn = document.getElementById('add-game-menu-button');
    
    if (addGameBtn) {
        addGameBtn.addEventListener('click', openAddGame);
        addGameBtn.addEventListener('click', closeAddGame);
    }
});