const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');
let gamesCache = null;
let activeIndex = -1;

/**
 * Adds suggestions to the search bar based on the games in the library.
 * Suggestions are added as div elements with the class 'suggestion'.
 * The text content of each suggestion is the name of the game.
 * @throws {Error} If there is an error loading the games.
 */
async function autoCompleteSearch(query) {
    suggestions.innerHTML = '';
    activeIndex = -1;

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

/**
 * Handles keydown events on the search bar.
 * If the key pressed is one of the arrow keys, it will move the active index up or down
 * the list of suggestions. If the enter key is pressed, it will simulate a click on the
 * currently active suggestion.
 * @param {KeyboardEvent} e The event object passed to the function.
 */
function handleKeydown(e) {
    const items = suggestions.querySelectorAll('.suggestion-item');
    if (!items.length || suggestions.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
    } 
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
    } 
    else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0) {
            items[activeIndex].click();
        }
        return;
    } 
    else {
        return;
    }

    items.forEach(item => item.classList.remove('active'));
    items[activeIndex].classList.add('active');
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

searchInput.addEventListener('keydown', handleKeydown);
