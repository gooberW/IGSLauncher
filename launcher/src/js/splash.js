document.addEventListener('DOMContentLoaded', () => {
      const fill = document.querySelector('.fill');

      if (fill && window.loaderAPI) {
        window.loaderAPI.onProgress(percent => {
          fill.style.width = `${percent}%`;
        });
      }
    });