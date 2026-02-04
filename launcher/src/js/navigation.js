/* NAVIGATION (arrows at the top) */

async function updateButtons () {
  const goBackBtn = document.getElementById('goBackBtn')
  const goForwardBtn = document.getElementById('goForwardBtn')

  const { history, historyIndex } = await window.electronAPI.getHistory()

  if (historyIndex > 0) {
    goBackBtn?.classList.add('enabled')
  } else {
    goBackBtn?.classList.remove('enabled')
  }

  if (historyIndex < history.length - 1) {
    goForwardBtn?.classList.add('enabled')
  } else {
    goForwardBtn?.classList.remove('enabled')
  }

  console.log('History:', history, 'Index:', historyIndex)
}

export async function navigateTo (page, addToHistory = true) {
  await window.electronAPI.changePage(page, addToHistory)
  await updateButtons()
}

document.addEventListener('DOMContentLoaded', async () => {
  // Sync buttons with main-process history
  await updateButtons()

  const settingsBtn = document.getElementById('settingsBtn')
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      navigateTo('./settings.html')
    })
  }

  const homeBtn = document.getElementById('homeBtn')
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      navigateTo('./index.html')
    })
  }

  const goBackBtn = document.getElementById('goBackBtn')
  if (goBackBtn) {
  goBackBtn.addEventListener('click', async () => {
    await window.electronAPI.navigateHistory('back')
    await updateButtons()
  })
}
const goForwardBtn = document.getElementById('goForwardBtn')
if (goForwardBtn) {
  goForwardBtn.addEventListener('click', async () => {
    await window.electronAPI.navigateHistory('forward')
    await updateButtons()
  })
}

})
