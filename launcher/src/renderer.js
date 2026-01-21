async function displayGames() {
    const container = document.getElementById('games'); 

    if (!container) {
        console.error("Could not find the 'games' div in HTML");
        return;
    }

    try {
        const data = await window.electronAPI.loadGames(); 
        container.innerHTML = '';

        Object.entries(data.games).forEach(([name, info]) => {
            console.log("Adding game:", name);

            const gameBox = document.createElement('div');
            gameBox.className = 'game-box';

            gameBox.innerHTML = `
                <img src="local-resource://${info.coverImage}" alt="${name}">
                <h2 class="game-title">${name}</h2>
                <div class="row">
                    <button class="play-btn" title="Play ${name}">
                        <img src="assets/play-fill.svg" alt="Play ${name}">
                    </button>
                    <button class="play-btn" title="More info">
                        <img src="assets/info-lg.svg" alt="Info for ${name}">
                    </button>
                </div>
            `;

            container.appendChild(gameBox);
        });
    } catch (err) {
        console.error("Error loading games:", err);
    }
}

document.addEventListener('DOMContentLoaded', displayGames);