/**
 * Displays all the games in the 'games' div.
 * @throws {Error} If there is an error loading the games.
 */
let gamesData = null;
let currentGame = null;
let currentSort = 'dateAdded'; // Default sort mode

import { openEditGame } from "./add-game.js";
import { showAlert, showConfirmation } from "./alert.js";

/**
 * Sorts an array of games based on the specified mode
 * @param {Array} gamesArray - Array of game objects
 * @param {string} mode - Sort mode: 'az', 'za', 'release', 'dateAdded'
 * @returns {Array} Sorted array
 */
function sortGamesArray(gamesArray, mode) {
    const sorted = gamesArray.slice(); // copy
    
    switch(mode) {
        case 'az':
            return sorted.sort((a, b) => 
                (a.title || '').localeCompare(b.title || '')
            );
        
        case 'za':
            return sorted.sort((a, b) => 
                (b.title || '').localeCompare(a.title || '')
            );
        
        case 'release':
            return sorted.sort((a, b) => 
                new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0)
            );
        
        case 'dateAdded':
            return sorted.sort((a, b) => 
                parseInt(a.id) - parseInt(b.id)
            );
        
        default:
            return sorted;
    }
}

/**
 * Displays all the games in the 'games' div with optional sorting
 * @param {string} sortMode - The sort mode to apply
 * @throws {Error} If there is an error loading the games.
 */
export async function displayGames(sortMode = currentSort) {
    const container = document.getElementById('games'); 

    if (!container) {
        console.error("Could not find the 'games' div in HTML");
        return;
    }

    try {
        const data = await window.electronAPI.loadGames(); 
        container.innerHTML = '';
        gamesData = data;

        currentSort = sortMode;

        let gamesArray = Object.entries(data).map(([id, info]) => ({ id, ...info }));
        gamesArray = sortGamesArray(gamesArray, sortMode);

        // display sorted games
        gamesArray.forEach(({ id, ...info }) => {
            console.log("Adding game:", info.title);
            const coverSrc = info.coverImage
                ? `local-resource://${info.coverImage.replace(/\\/g, '/')}`
                : '';

            const gameBox = document.createElement('div');
            gameBox.className = 'game-box';
            gameBox.style.backgroundImage = `url("${coverSrc}")`;
            gameBox.innerHTML = `
                <div class="row">
                    <button id="play-game-${id}" class="play-btn" data-title="Play" >
                        <div class="icon icon-play"></div>
                    </button>
                    <button id="info-${id}" class="play-btn" data-title="More info">
                        <div class="icon icon-info"></div>
                    </button>
                </div>
            `;

            const infoButton = gameBox.querySelector(`#info-${id}`);
            infoButton.onclick = () => openSidebar(id);

            const playButton = gameBox.querySelector(`#play-game-${id}`);

            playButton.onclick = async () => {
                const exePath = info.path;
                const result = await window.electronAPI.launchGame(exePath);

                if (!result.success) {
                    showAlert(`Failed to launch game: ${result.error}`);
                }
            };
            container.appendChild(gameBox);
        });
    } catch (err) {
        console.error("Error loading games:", err);
    }
}

/**
 * Applies sorting and updates the display
 * @param {string} mode - The sort mode to apply
 */
function applySorting(mode) {
    currentSort = mode;
    displayGames(mode);
}

/**
 * Removes the currently selected game from the library.
 * Prompts the user to confirm the removal and displays an alert if the removal fails.
 * If the removal is successful, it also closes the sidebar and updates the game list.
 */
async function removeGame() {
    if (!currentGame) return;

    const gameInfo = gamesData[currentGame];
    const gameName = gameInfo ? gameInfo.title : "Unknown Game";
    const confirmed = await showConfirmation(`Remove "${gameName}" from library?`);
    if (!confirmed) return;

    const result = await window.electronAPI.removeGame(currentGame);
    const sidebar = document.querySelector('.sidebar');
    if (result.success) {
        currentGame = null;
        if (sidebar) sidebar.classList.remove('active');
        displayGames();
    } else {
        showAlert('Failed to remove game');
    }
}

/**
 * Displays the sidebar with the game info for the game that was clicked.
 * @remarks The game info will be retrieved from the data object.
 * @todo Implement this function.
 */
export async function openSidebar(id) {
    const gameInfo = gamesData[id];
    const sidebar = document.querySelector('.sidebar');
    currentGame = id;

    if (!gameInfo || !sidebar) return;

    sidebar.querySelector('h3').innerText = gameInfo.title || "Unknown Game";

    const tagsContainer = sidebar.querySelector('#tags');
    tagsContainer.innerHTML = '';
    (gameInfo.tags || []).forEach(tag => {
        const p = document.createElement('p');
        p.className = 'tag';
        p.innerText = tag;
        tagsContainer.appendChild(p);
    });

    const sidebarPlay = sidebar.querySelector('#sidebarPlay');
    sidebarPlay.onclick = () => {
        window.electronAPI.launchGame(gameInfo.path);
    };

    fillDevelopers(id);
    fillPublishers(id);

    const descContainer = sidebar.querySelector('#description');
    descContainer.innerHTML = formatDescription(
        gameInfo.description || "No description available."
    );

    sidebar.classList.add('active');

    // install size is calculated in the background
    const installSizeElement = sidebar.querySelector('#installSize');
    installSizeElement.innerText = "Calculating...";

    calculateSizeInBackground(gameInfo.path, installSizeElement);
}

function fillDevelopers(id) {
    const developersElement = document.getElementById(`developers`);
    developersElement.innerHTML = '';

    const developers = gamesData[id].developers;
    const developersList = developers.split(',');

    if (developersList.length === 0) {
        developersElement.innerHTML = `<p>Unknown</p>`;
        return;
    }
    
    developersList.forEach(developer => {
        developersElement.innerHTML += `<p>${developer}</p>`;
    })
}

function fillPublishers(id) {
    const publishersElement = document.getElementById(`publishers`);
    publishersElement.innerHTML = '';
    const publishers = gamesData[id].publishers;
    const publishersList = publishers.split(',');

    if (publishersList.length === 0) {
        publishersElement.innerHTML = `<p>Unknown</p>`;
        return;
    }
    
    publishersList.forEach(publisher => {
        publishersElement.innerHTML += `<p>${publisher}</p>`;
    })
}

async function calculateSizeInBackground(path, element) {
    try {
        if (!path) {
            throw new Error("No executable path found");
        }

        const result = await window.electronAPI.getInstallSize(path);
        
        if (result && result.success) {
            element.innerText = formatBytes(result.size);
        } else {
            element.innerText = "Unknown";
        }
    } catch (error) {
        console.error("Size calculation error:", error.message);
        element.innerText = "Error";
    }
}

function formatBytes(bytes) {
    console.log(bytes);
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatDescription(text) {
    return text
        .split(/\n\s*\n/)
        .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
}

/**
 * Closes the sidebar.
 * @todo Implement this function.
 */
export function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('active');
}

function toggleMoreMenu(event) {
    event.stopPropagation();
    moreMenu.classList.toggle('active');
}

function toggleSortMenu(event) {
    const sortList = document.getElementById('sortList');
    event.stopPropagation();
    sortList.classList.toggle('active');
}

function closeMoreMenu(event) {
    if (!event) {
        moreMenu.classList.remove('active');
        return;
    }

    if (!moreMenu.contains(event.target) && !moreBtn.contains(event.target)) {
        moreMenu.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sortItems = sortList.querySelectorAll('.sort-item');
        sortItems.forEach(item => {
            item.addEventListener('click', () => {
                const mode = item.dataset.mode;
                applySorting(mode);
                sortList.classList.remove('active');
            });
        });
    
    displayGames();
    // Sidebar / menu buttons
    const moreBtn = document.getElementById('moreBtn');
    const closeBtn = document.getElementById('closeSidebar');
    const removeGameBtn = document.getElementById('removeGameBtn');
    const editGameBtn = document.getElementById('editGameBtn');
    const sortBtn = document.getElementById('sortBtn');
    console.log("Sort button:", sortBtn);

    if(sortBtn) {
        sortBtn.addEventListener('click', toggleSortMenu);
    }

    if (moreBtn) {
        moreBtn.addEventListener('click', toggleMoreMenu);
    }
    document.addEventListener('click', closeMoreMenu);

    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }

    if (removeGameBtn) {
        removeGameBtn.addEventListener('click', removeGame);
    }

    if (editGameBtn) {
        editGameBtn.addEventListener('click', () => {
            openEditGame(currentGame, gamesData[currentGame]);
            closeMoreMenu();
        });
    }

    const filterBtn = document.getElementById('filterBtn');
    const input = document.getElementById('filterTag');

    filterBtn.addEventListener('click', () => {
        filterBtn.classList.toggle('active');
        input.focus();
    });

    /* TESTING
    const tooltipText = document.getElementById("hoverTooltipText");
    const tooltip = document.getElementById("hoverTooltip");

    document.addEventListener("mouseenter", (e) => {
    const target = e.target.closest("[data-title]");
    if (!target) return;

    tooltipText.textContent = target.dataset.title;
    tooltip.classList.add("visible");
    }, true);

    document.addEventListener("mouseleave", (e) => {
    const target = e.target.closest("[data-title]");
    if (!target) return;

    tooltip.classList.remove("visible");
    tooltipText.textContent = "";
    }, true);

    */

})