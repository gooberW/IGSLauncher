import { openEditGame, showInExplorer } from "./add-game.js";
import { showAlert, showConfirmation } from "./alert.js";
import { toFileURL } from "./search.js";

let gamesData = null;
let currentGame = null;
let currentSort = 'latestAdded';
let installSizeCache = {};
let selectedTags = new Set();

let runningGames = new Map();
let runningGameTitle = null;

/**
 * Returns a sorted copy of the games array.
 * @param {Array} gamesArray
 * @param {string} mode - 'az' | 'za' | 'earliestAdded' | 'latestAdded'
 * @returns {Array}
 */
function sortGamesArray(gamesArray, mode) {
    const sorted = gamesArray.slice();

    switch (mode) {
        case 'az':
            return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        case 'za':
            return sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        case 'earliestAdded':
            return sorted.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        case 'latestAdded':
            return sorted.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        default:
            return sorted;
    }
}

/**
 * Returns only games that have at least one of the selected tags (OR logic).
 * @param {Array} gamesArray
 * @returns {Array}
 */
function filterGamesByTags(gamesArray) {
    return gamesArray.filter(game => {
        const gameTags = game.tags || [];
        return [...selectedTags].some(tag => gameTags.includes(tag));
    });
}

/**
 * Updates currentSort and re-renders the game list.
 * @param {string} mode
 */
function applySorting(mode) {
    currentSort = mode;
    displayGames(mode);
}

/**
 * Fetches game data, then renders all game cards into #games.
 * @param {string} sortMode
 */
export async function displayGames(sortMode = currentSort) {
    const container = document.getElementById('games');
    if (!container) return;

    container.style = '';

    try {
        const data = await window.electronAPI.loadGames();
        container.innerHTML = '';
        gamesData = data;
        currentSort = sortMode;

        displayTagFilters(data);

        let gamesArray = Object.entries(data).map(([id, info]) => ({ id, ...info }));

        if (gamesArray.length === 0) return;

        gamesArray = sortGamesArray(gamesArray, sortMode);

        if (selectedTags.size > 0) {
            gamesArray = filterGamesByTags(gamesArray);
        }

        const isListView = container.classList.contains('list');

        gamesArray.forEach(({ id, ...info }) => {
            container.appendChild(buildGameCard(id, info, isListView));
        });

    } catch (err) {
        console.error('Error loading games:', err);
    }
}

/**
 * Builds and returns a single game card element.
 * @param {string} id
 * @param {Object} info
 * @param {boolean} isListView
 * @returns {HTMLElement}
 */
function buildGameCard(id, info, isListView) {
    const gameBox = document.createElement('div');
    gameBox.className = 'box-light full-height column items-end';

    if (info.coverImage && !isListView) {
        const coverSrc = `local-resource://${info.coverImage.replace(/\\/g, '/')}`;
        gameBox.style.backgroundImage = `url("${coverSrc}")`;
    }

    const iconSrc = (info.icon && info.icon.trim())
        ? `local-resource://${info.icon.replace(/\\/g, '/')}`
        : './assets/default_game_icon.png';

    const safeTitle = info.title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    gameBox.innerHTML = isListView
        ? `
            <div class="row gap-05">
                <div class="game-icon" style="background-image: url('${iconSrc}')"></div>
                <div class="game-title">${safeTitle}</div>
            </div>
            <div class="row gap-05 game-btns">
                <button id="play-game-${id}" class="box-dark btn square">
                    <i class="bi bi-play-fill"></i>
                </button>
                <button id="info-${id}" class="box-dark btn square">
                    <i class="bi bi-info-lg"></i>
                </button>
            </div>
        `
        : `
            <div class="row gap-05 game-btns">
                <button id="play-game-${id}" class="box-dark btn square">
                    <i class="bi bi-play-fill"></i>
                </button>
                <button id="info-${id}" class="box-dark btn square">
                    <i class="bi bi-info-lg"></i>
                </button>
            </div>
        `;

    gameBox.querySelector(`#info-${id}`).onclick = () => openSidebar(id);

    gameBox.querySelector(`#play-game-${id}`).onclick = async () => {
        const result = await window.electronAPI.launchGame(info.path);
        if (!result.success) {
            showAlert(`Failed to launch game: ${result.error}`);
        } else {
            runningGames.set(info.path, info.title);
            updateRunningGameBanner();
        }
    };

    return gameBox;
}

function updateRunningGameBanner() {
    const div = document.getElementById('game-running-div');
    if (!div) return;

    div.innerHTML = '';

    runningGames.forEach((title) => {
        const banner = document.createElement('div');
        banner.className = 'game-running box-dark small row gap-05 active';
        banner.innerHTML = `<div class="circle"></div><p>${title}</p>`;
        div.appendChild(banner);
    });
}

/**
 * Opens the sidebar and populates it with info for the given game id.
 * @param {string} id
 */
export async function openSidebar(id) {
    const gameInfo = gamesData[id];
    const sidebar = document.querySelector('.sidebar');
    if (!gameInfo || !sidebar) return;

    currentGame = id;

    sidebar.querySelector('h3').innerText = gameInfo.title || 'Unknown Game';

    // Tags
    const tagsContainer = sidebar.querySelector('#tags');
    tagsContainer.innerHTML = '';
    (gameInfo.tags || []).forEach(tag => {
        const p = document.createElement('p');
        p.className = 'box-light border-dashed wide row gap-05 br-1';
        p.innerHTML = tag;
        tagsContainer.appendChild(p);
    });

    // Play button
    sidebar.querySelector('#sidebarPlay').onclick = () => {
        window.electronAPI.launchGame(gameInfo.path);
    };

    // Credits
    fillCredits('developers', id);
    fillCredits('publishers', id);

    // Description
    sidebar.querySelector('#description').innerHTML = formatDescription(
        gameInfo.description || 'No description available.'
    );

    sidebar.classList.add('active');

    // Install size
    const installSizeElement = sidebar.querySelector('#installSize');
    calculateSizeInBackground(gameInfo.path, installSizeElement, id);
}

/**
 * Closes the sidebar.
 */
export function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('active');
}

/**
 * Fills a credits container (developers or publishers) for the given game.
 * Replaces the separate fillDevelopers / fillPublishers functions.
 * @param {'developers'|'publishers'} field
 * @param {string} id
 */
function fillCredits(field, id) {
    const el = document.getElementById(field);
    if (!el) return;

    el.innerHTML = '';
    const raw = gamesData[id]?.[field] || '';
    const list = raw.split(',').map(s => s.trim()).filter(Boolean);

    if (list.length === 0) {
        el.innerHTML = '<p>Unknown</p>';
        return;
    }

    list.forEach(name => {
        const p = document.createElement('p');
        p.textContent = name;
        el.appendChild(p);
    });
}

/**
 * Removes the currently selected game from the library after confirmation.
 */
async function removeGame() {
    if (!currentGame) return;

    const gameInfo = gamesData[currentGame];
    const gameName = gameInfo ? gameInfo.title : 'Unknown Game';
    const confirmed = await showConfirmation(`Remove "${gameName}" from library?`);
    if (!confirmed) return;

    const result = await window.electronAPI.removeGame(currentGame);
    if (result.success) {
        currentGame = null;
        closeSidebar();
        displayGames();
    } else {
        showAlert('Failed to remove game');
    }
}

/**
 * Calculates the install size of a game in the background and updates the element.
 * Results are cached by gameId to avoid repeated calculations.
 * @param {string} path
 * @param {HTMLElement} element
 * @param {string} gameId
 */
export async function calculateSizeInBackground(path, element, gameId) {
    try {
        if (!path) throw new Error('No executable path found');

        if (installSizeCache[gameId] !== undefined) {
            element.innerHTML = `<p>${formatBytes(installSizeCache[gameId])}</p>`;
            return;
        }

        element.innerHTML = `<i class="bi bi-arrow-repeat"></i>`;

        const result = await window.electronAPI.getInstallSize(path);

        if (result?.success) {
            installSizeCache[gameId] = result.size;
            element.innerHTML = `<p>${formatBytes(result.size)}</p>`;
        } else {
            element.innerHTML = `<p>Unknown</p>`;
        }
    } catch (error) {
        console.error('Size calculation error:', error.message);
        element.innerHTML = `<p>Error</p>`;
    }
}

/**
 * Removes a game's cached install size so it is recalculated next time.
 * @param {string} gameId
 */
export function clearInstallSizeCache(gameId) {
    delete installSizeCache[gameId];
}

/**
 * Converts a byte count to a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Wraps double-newline-separated paragraphs in <p> tags.
 * @param {string} text
 * @returns {string}
 */
function formatDescription(text) {
    return text
        .split(/\n\s*\n/)
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

/**
 * Rebuilds the tag filter list from the current game data.
 * Previously selected tags are re-highlighted.
 * @param {Object} data - Raw games data object
 */
function displayTagFilters(data) {
    const filterList = document.getElementById('filterList');
    if (!filterList) return;

    filterList.innerHTML = '';
    if (!data) return;

    const allTags = new Set(
        Object.values(data).flatMap(g => g.tags || [])
    );

    allTags.forEach(tag => {
        const p = document.createElement('p');
        p.className = 'tag';
        p.innerText = tag;
        if (selectedTags.has(tag)) p.classList.add('selected');
        p.addEventListener('click', () => selectTag(p));
        filterList.appendChild(p);
    });

    const clearBtn = document.createElement('div');
    clearBtn.className = 'box-dark btn';
    clearBtn.innerText = 'Clear Filters';
    clearBtn.addEventListener('click', () => {
        selectedTags.clear();
        updateTagCounter();
        displayGames();
    });
    filterList.appendChild(clearBtn);
}

/**
 * Toggles a tag's selected state and refreshes the game list.
 * @param {HTMLElement} tagElement
 */
function selectTag(tagElement) {
    const tagName = tagElement.innerText;

    if (selectedTags.has(tagName)) {
        selectedTags.delete(tagName);
        tagElement.classList.remove('selected');
    } else {
        selectedTags.add(tagName);
        tagElement.classList.add('selected');
    }

    updateTagCounter();
    displayGames(currentSort);
}

/**
 * Updates the visible tag counter badge.
 */
function updateTagCounter() {
    const counter = document.getElementById('tagCounter');
    if (counter) counter.innerText = selectedTags.size;
}

/**
 * Toggles between grid and list view.
 */
function changeView() {
    const container = document.getElementById('games');
    const viewBtn = document.getElementById('viewBtn');
    if (!container || !viewBtn) return;

    container.classList.toggle('list');
    const isNowList = container.classList.contains('list');
    viewBtn.innerHTML = `<i class="bi bi-${isNowList ? 'grid' : 'view-stacked'}"></i>`;
    displayGames(currentSort);
}

/**
 * Closes all open dropdown menus except the one being opened.
 * @param {HTMLElement|null} except - Menu element to leave open
 */
function closeAllMenus(except = null) {
    const menus = [
        document.getElementById('sortList'),
        document.getElementById('filterList'),
        document.getElementById('moreMenu'),
    ];
    menus.forEach(menu => {
        if (menu && menu !== except) menu.classList.remove('active');
    });
}

function toggleSortMenu(event) {
    event.stopPropagation();
    const sortList = document.getElementById('sortList');
    if (!sortList) return;
    const isOpen = sortList.classList.contains('active');
    closeAllMenus();
    if (!isOpen) sortList.classList.add('active');
}

function toggleFilterMenu(event) {
    event.stopPropagation();
    const filterList = document.getElementById('filterList');
    if (!filterList) return;
    const isOpen = filterList.classList.contains('active');
    closeAllMenus();
    if (!isOpen) filterList.classList.add('active');
}

function toggleMoreMenu(event) {
    event.stopPropagation();
    const moreMenu = document.getElementById('moreMenu');
    if (!moreMenu) return;
    const isOpen = moreMenu.classList.contains('active');
    closeAllMenus();
    if (!isOpen) moreMenu.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    displayGames();

    const moreBtn = document.getElementById('moreBtn');
    const moreMenu = document.getElementById('moreMenu');
    const closeBtn = document.getElementById('closeSidebar');
    const removeGameBtn = document.getElementById('removeGameBtn');
    const editGameBtn = document.getElementById('editGameBtn');
    const showInExplorerBtn = document.getElementById('showInExplorerBtn');
    const sortBtn = document.getElementById('sortBtn');
    const sortList = document.getElementById('sortList');
    const filterBtn = document.getElementById('filterBtn');
    const changeViewBtn = document.getElementById('viewBtn');
    const websiteBtn = document.getElementById('website');

    if (sortList) {
        sortList.querySelectorAll('.sort-item').forEach(item => {
            item.addEventListener('click', () => {
                applySorting(item.dataset.mode);
                sortList.classList.remove('active');
            });
        });
    }

    websiteBtn?.addEventListener('click', () => {
        window.open('https://iselgamestudios.com', '_blank');
    });

    changeViewBtn?.addEventListener('click', changeView);
    sortBtn?.addEventListener('click', toggleSortMenu);
    filterBtn?.addEventListener('click', toggleFilterMenu);
    moreBtn?.addEventListener('click', toggleMoreMenu);
    closeBtn?.addEventListener('click', closeSidebar);
    removeGameBtn?.addEventListener('click', removeGame);

    editGameBtn?.addEventListener('click', () => {
        openEditGame(currentGame, gamesData[currentGame]);
        closeAllMenus();
    });

    showInExplorerBtn?.addEventListener('click', () => {
        showInExplorer(gamesData[currentGame].path);
        closeAllMenus();
    });

    document.addEventListener('click', () => closeAllMenus());

    window.electronAPI.onGameClosed((closedPath) => {
        runningGames.delete(closedPath);
        updateRunningGameBanner();
    });
});