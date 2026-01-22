let gamesData = null;

/**
 * Displays all the games in the 'games' div.
 * @throws {Error} If there is an error loading the games.
 */
async function displayGames() {
    const container = document.getElementById('games'); 

    if (!container) {
        console.error("Could not find the 'games' div in HTML");
        return;
    }

    try {
        const data = await window.electronAPI.loadGames(); 
        container.innerHTML = '';
        gamesData = data.games;

        Object.entries(data.games).forEach(([name, info]) => {
            console.log("Adding game:", name);
            const safeCoverPath = info.coverImage.replace(/\\/g, '/');
            const coverSrc = `local-resource://${safeCoverPath}`;
            const gameBox = document.createElement('div');
            gameBox.className = 'game-box';
            gameBox.style.backgroundImage = `url("${coverSrc}")`;
            gameBox.innerHTML = `
                <div class="row">
                    <button id="play-game"class="play-btn" title="Play ${name}">
                        <img src="assets/play-fill.svg" alt="Play ${name}">
                    </button>
                    <button id="info" class="play-btn" title="More info">
                        <img src="assets/info-lg.svg" alt="Info for ${name}">
                    </button>
                </div>
            `;

            const infoButton = gameBox.querySelector('#info');
            infoButton.onclick = () => openSidebar(name);

            const playButton = gameBox.querySelector('#play-game');

            playButton.onclick = async () => {
                const exePath = info.path;
                const result = await window.electronAPI.launchGame(exePath);

                if (!result.success) {
                    alert(`Failed to launch game: ${result.error}`);
                }
            };
            container.appendChild(gameBox);
        });
    } catch (err) {
        console.error("Error loading games:", err);
    }
}

document.addEventListener('DOMContentLoaded', displayGames);


/**
 * Opens the settings window.
 * 
 * @todo Implement this function.
 */
async function openSettings() {
    // TODO
    // this will open the settings window.
}

/**
 * Displays the sidebar with the game info for the game that was clicked.
 * @remarks The game info will be retrieved from the data object.
 * @todo Implement this function.
 */
function openSidebar(gameName) {
    const gameInfo = gamesData[gameName];
    const sidebar = document.querySelector('.sidebar');

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
    descContainer.innerHTML = `<p>${gameInfo.description || "No description available."}</p>`;

    sidebar.classList.add('active');
}

/**
 * Closes the sidebar.
 * @todo Implement this function.
 */
function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeSidebar');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }
});

