const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');
let gamesCache = null;
/**
 * Adds suggestions to the search bar based on the games in the library.
 * Suggestions are added as div elements with the class 'suggestion'.
 * The text content of each suggestion is the name of the game.
 * @throws {Error} If there is an error loading the games.
 */
async function autoCompleteSearch(query) {
    suggestions.innerHTML = '';

    if (!query) {
        suggestions.style.display = 'none';
        return;
    }

    const games = await loadGamesOnce();

    const matches = games.filter(name =>
        name.toLowerCase().includes(query.toLowerCase())
    );

    if (!matches.length) {
        suggestions.style.display = 'none';
        return;
    }

    matches.forEach(name => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = name;

        item.addEventListener('click', () => {
            searchInput.value = name;
            suggestions.style.display = 'none';
        });

        suggestions.appendChild(item);
    });

    suggestions.style.display = 'block';
}

async function loadGamesOnce() {
    if (gamesCache) return gamesCache;

    try {
        const data = await window.electronAPI.loadGames();
        gamesCache = Object.keys(data.games);
        return gamesCache;
    } catch (err) {
        console.error("Error loading games:", err);
        return [];
    }
}

searchInput.addEventListener('input', (e) => {
    autoCompleteSearch(e.target.value);
});

searchInput.addEventListener('focus', (e) => {
    if (e.target.value) autoCompleteSearch(e.target.value);
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        suggestions.style.display = 'none';
    }
});