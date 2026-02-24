const searchInput = document.getElementById('searchInput');
const searchBar = document.getElementById('search');
const suggestions = document.getElementById('suggestions');
let gamesCache = null;
let gameNamesCache = [];
let activeIndex = -1;

import { openSidebar } from "./renderer.js";

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

    const gamesData = await getGamesData();

    if (!gameNamesCache.length) {
        suggestions.style.display = 'none';
        return;
    }

    const matches = gameNamesCache.filter(name =>
        name.toLowerCase().includes(query.toLowerCase())
    );

    if (!matches.length) {
        suggestions.style.display = 'none';
        return;
    }

    matches.forEach(name => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';

        const icon = document.createElement('div');
        icon.className = 'suggestion-icon';

        const text = document.createElement('div');
        text.className = 'suggestion-text';
        text.textContent = name;

        const matchID = Object.keys(gamesData).find(
            key => gamesData[key].title === name
        );

        const game = gamesData[matchID];

        const iconSrc =
            game.icon && game.icon.trim() !== ''
                ? toFileURL(game.icon)
                : './assets/default_game_icon.png';

        icon.style.backgroundImage = `url("${iconSrc}")`;

        item.appendChild(icon);
        item.appendChild(text);

        item.addEventListener('click', () => {
            searchInput.value = '';
            suggestions.style.display = 'none';
            openSidebar(matchID);
        });

        suggestions.appendChild(item);
    });

    suggestions.style.display = 'block';
}

async function getGamesData() {
    if (!gamesCache) {
        gamesCache = await window.electronAPI.loadGames();
        gameNamesCache = Object.values(gamesCache).map(info => info.title);
    }
    return gamesCache;
}

export function toFileURL(filePath) {
    if (!filePath) return '';
    return `file:///${filePath.replace(/\\/g, '/')}`;
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
            searchInput.value = '';
            searchInput.blur();
        }
        return;
    } 
    else {
        return;
    }

    items.forEach(item => item.classList.remove('active'));
    items[activeIndex].classList.add('active');
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
suggestions.style.display = 'none';

document.addEventListener('keydown', (e) => {
    // ignores if user is already typing in an input or textarea
    const isTyping =
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable;

    if (isTyping) return;

    if (e.key === '\\') {
        e.preventDefault();
        searchInput.focus();
        search.classList.add('focused');
    }
});

document.addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    search.classList.remove('focused');
    searchInput.blur();
});

