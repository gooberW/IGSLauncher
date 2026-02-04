let gamesData = null;
let currentGame = null;
import { openEditGame } from "./add-game.js";
import { showAlert, showConfirmation } from "./alert.js";



/**
 * Displays all the games in the 'games' div.
 * @throws {Error} If there is an error loading the games.
 */
export async function displayGames() {
    const container = document.getElementById('games'); 

    if (!container) {
        console.error("Could not find the 'games' div in HTML");
        return;
    }

    try {
        const data = await window.electronAPI.loadGames(); 
        container.innerHTML = '';
        gamesData = data;

        Object.entries(data).forEach(([id, info]) => {
            console.log("Adding game:", info.title);
            const safeCoverPath = info.coverImage.replace(/\\/g, '/');
            const coverSrc = `local-resource://${safeCoverPath}`;
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

            // no futuro se calahar adiciona-se o pin
            /*
            <div class="row top">
                <div id="pin-${id}" class="icon icon-pin" data-title="Pin Game"></div>
            </div>
            */

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
export function openSidebar(id) {
    const gameInfo = gamesData[id];
    const sidebar = document.querySelector('.sidebar');
    currentGame = id;

    const gameName = gameInfo ? gameInfo.title : "Unknown Game";

    if (!gameInfo || !sidebar) return;

    sidebar.querySelector('h3').innerText = gameName;

    const tagsContainer = sidebar.querySelector('#tags');
    tagsContainer.innerHTML = ''; 
    if (gameInfo.tags) {
        gameInfo.tags.forEach(tag => {
            const p = document.createElement('p');
            p.className = 'tag';
            p.innerText = tag;
            tagsContainer.appendChild(p);
        });
    }

    const sidebarPlay = sidebar.querySelector('#sidebarPlay');
    sidebarPlay.addEventListener('click', () => {
        const exePath = gameInfo.path;
        window.electronAPI.launchGame(exePath);
    });

    const descContainer = sidebar.querySelector('#description');
    const formattedDesc = formatDescription(gameInfo.description || "No description available.");
    descContainer.innerHTML = formattedDesc;

    sidebar.classList.add('active');
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

    displayGames();
    // Sidebar / menu buttons
    const moreBtn = document.getElementById('moreBtn');
    const moreMenu = document.getElementById('moreMenu');
    const closeBtn = document.getElementById('closeSidebar');
    const removeGameBtn = document.getElementById('removeGameBtn');
    const editGameBtn = document.getElementById('editGameBtn');

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
})