/*NAVIGATION (arrows at the top)*/
let history = []
let historyIndex = -1

function updateButtons () {
  const goBackBtn = document.getElementById('goBackBtn')
  const goForwardBtn = document.getElementById('goForwardBtn')

  if (historyIndex > 0) {
    goBackBtn.classList.add('enabled')
  } else {
    goBackBtn.classList.remove('enabled')
  }

  if (historyIndex < history.length - 1) {
    goForwardBtn.classList.add('enabled')
  } else {
    goForwardBtn.classList.remove('enabled')
  }

  console.log('History:', history, 'Index:', historyIndex)
}

export async function navigateTo (page, addToHistory = true) {
  if (addToHistory) {
    // removes forward history when navigating to new page
    history = history.slice(0, historyIndex + 1)
    history.push(page)
    historyIndex = history.length - 1
  }

  await window.electronAPI.changePage(page)
  updateButtons()
}

// Initialize history with current page
function initializeHistory(currentPage) {
  if (history.length === 0) {
    history.push(currentPage)
    historyIndex = 0
    updateButtons()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize history with the current page
  // You can get the current page from window.location or pass it as needed
  const currentPage = window.location.pathname.split('/').pop() || './index.html'
  initializeHistory(`./${currentPage}`)

  const settingsBtn = document.getElementById('settingsBtn')

  if (settingsBtn) {
    settingsBtn.addEventListener('click', async () => {
      await navigateTo('./settings.html')
    })
  }

  // Navigation buttons
  const goBackBtn = document.getElementById('goBackBtn')
  const goForwardBtn = document.getElementById('goForwardBtn')

  if (goForwardBtn) {
    goForwardBtn.addEventListener('click', async () => {
      if (historyIndex < history.length - 1) {
        historyIndex++
        await navigateTo(history[historyIndex], false)
      }
    })
  }

  if (goBackBtn) {
    goBackBtn.addEventListener('click', async () => {
      if (historyIndex > 0) {
        historyIndex--
        await navigateTo(history[historyIndex], false)
      }
    })
  }

  const homeBtn = document.getElementById('homeBtn')
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      navigateTo('./index.html')
    })
  }
})