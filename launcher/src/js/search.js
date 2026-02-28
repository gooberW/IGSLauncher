const searchInput = document.getElementById('searchInput');
const searchBar = document.getElementById('search');
const suggestions = document.getElementById('suggestions');

let gamesCache = null;   // full game data
let gameNamesCache = [];   // { id, title } for autocomplete
let activeIndex = -1;

import { openSidebar } from "./renderer.js";

/**
 * Load the games cache once at startup.
 */
export async function loadGamesCache() {
    if (!gamesCache) {
        gamesCache = await window.electronAPI.loadGames();
        gameNamesCache = Object.entries(gamesCache).map(([id, info]) => ({
            id,
            title: info.title || ""
        }));
    }
    return gamesCache;
}

/**
 * Updates the cached title for a game (used after renaming)
 */
export function updateNamesCache(gameId, newTitle) {
    const entry = gameNamesCache.find(g => g.id === gameId);

    if (entry) {
        entry.title = newTitle;
    } else {
        // fallback if cache missed it
        gameNamesCache.push({ id: gameId, title: newTitle });
    }

    if (gamesCache && gamesCache[gameId]) {
        gamesCache[gameId].title = newTitle;
    }
}

/**
 * Converts a local file path to a file:// URL
 */
export function toFileURL(filePath) {
    if (!filePath) return '';
    return `file:///${filePath.replace(/\\/g, '/')}`;
}

/**
 * Autocomplete search
 */
export function autoCompleteSearch(query) {
    suggestions.innerHTML = '';
    activeIndex = -1;

    if (!query || !gameNamesCache.length) {
        suggestions.style.display = 'none';
        return;
    }

    const matches = gameNamesCache.filter(game =>
        game.title && game.title.toLowerCase().includes(query.toLowerCase())
    );

    if (!matches.length) {
        suggestions.style.display = 'none';
        return;
    }

    matches.forEach(({ id, title }) => {
        const game = gamesCache[id];
        if (!game) return;

        const item = document.createElement('div');
        item.className = 'suggestion-item';

        const icon = document.createElement('div');
        icon.className = 'suggestion-icon';
        const text = document.createElement('div');
        text.className = 'suggestion-text';
        text.textContent = title;

        const iconSrc = game.icon && game.icon.trim()
            ? toFileURL(game.icon)
            : './assets/default_game_icon.png';

        icon.style.backgroundImage = `url("${iconSrc}")`;

        item.appendChild(icon);
        item.appendChild(text);

        item.addEventListener('click', () => {
            searchInput.value = '';
            suggestions.style.display = 'none';
            openSidebar(id);
        });

        suggestions.appendChild(item);
    });

    suggestions.style.display = 'block';
}

/**
 * Handles keyboard navigation in suggestions
 */
function handleKeydown(e) {
    const items = suggestions.querySelectorAll('.suggestion-item');
    if (!items.length || suggestions.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0) {
            items[activeIndex].click();
            searchInput.value = '';
            searchInput.blur();
        }
        return;
    } else {
        return;
    }

    items.forEach(item => item.classList.remove('active'));
    items[activeIndex].classList.add('active');
}

// Event listeners
searchInput.addEventListener('input', (e) => autoCompleteSearch(e.target.value));
searchInput.addEventListener('focus', (e) => {
    if (e.target.value) autoCompleteSearch(e.target.value);
});
searchInput.addEventListener('keydown', handleKeydown);

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        suggestions.style.display = 'none';
    }
});

document.addEventListener('keydown', (e) => {
    const isTyping =
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable;

    if (isTyping) return;

    if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
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

suggestions.style.display = 'none';

// Load cache at startup
document.addEventListener('DOMContentLoaded', async () => {
    await loadGamesCache();
});