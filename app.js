document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Iconos
  lucide.createIcons();

  // Elementos DOM
  const audioList = document.getElementById('audioList');
  const uploadForm = document.getElementById('uploadForm');
  const uploadModal = document.getElementById('uploadModal');
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const searchInput = document.getElementById('searchInput');
  const navItems = document.querySelectorAll('.nav-menu li');

  // Reproductor DOM
  const audioElement = document.getElementById('audioElement');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const progressBar = document.getElementById('progressBar');
  const volumeSlider = document.getElementById('volumeSlider');
  const playerTitle = document.getElementById('playerTitle');
  const playerCategory = document.getElementById('playerCategory');
  const currentTimeSpan = document.getElementById('currentTime');
  const durationSpan = document.getElementById('duration');

  // Estado Local
  let tracks = [];
  let currentTrackIndex = null;
  let activeCategory = 'all';

  // Modal handlers
  openModalBtn.addEventListener('click', () => uploadModal.classList.add('active'));
  closeModalBtn.addEventListener('click', () => uploadModal.classList.remove('active'));

  // Subir Audio
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = document.getElementById('audioFileInput').files[0];
    const title = document.getElementById('audioTitleInput').value;
    const category = document.getElementById('audioCategoryInput').value;
    const tags = document.getElementById('audioTagsInput').value.split(',').map(t => t.trim()).filter(t => t);

    if (file) {
      const track = {
        id: Date.now(),
        title: title || file.name,
        category,
        tags,
        fileUrl: URL.createObjectURL(file)
      };

      tracks.push(track);
      renderTracks();
      uploadForm.reset();
      uploadModal.classList.remove('active');
    }
  });

  // Renderizar Tabla
  function renderTracks() {
    audioList.innerHTML = '';

    const query = searchInput.value.toLowerCase();
    const filteredTracks = tracks.filter(track => {
      const matchesCategory = activeCategory === 'all' || track.category === activeCategory;
      const matchesSearch = track.title.toLowerCase().includes(query) || 
                            track.tags.some(t => t.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });

    filteredTracks.forEach((track, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${track.title}</strong></td>
        <td>${track.category}</td>
        <td>${track.tags.map(t => `<span class="tag">${t}</span>`).join('')}</td>
        <td style="text-align: right;">
          <button class="btn-play-row" onclick="playTrack(${track.id})">
            <i data-lucide="play-circle"></i>
          </button>
        </td>
      `;
      audioList.appendChild(tr);
    });

    lucide.createIcons();
  }

  // Play audio
  window.playTrack = function(id) {
    const track = tracks.find(t => t.id === id);
    if (!track) return;

    audioElement.src = track.fileUrl;
    audioElement.play();

    playerTitle.textContent = track.title;
    playerCategory.textContent = track.category;
    playPauseBtn.disabled = false;
    updatePlayIcon(true);
  };

  // Player controls
  playPauseBtn.addEventListener('click', () => {
    if (audioElement.paused) {
      audioElement.play();
      updatePlayIcon(true);
    } else {
      audioElement.pause();
      updatePlayIcon(false);
    }
  });

  function updatePlayIcon(isPlaying) {
    playPauseBtn.innerHTML = isPlaying ? `<i data-lucide="pause"></i>` : `<i data-lucide="play"></i>`;
    lucide.createIcons();
  }

  audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration) {
      const progress = (audioElement.currentTime / audioElement.duration) * 100;
      progressBar.value = progress;
      currentTimeSpan.textContent = formatTime(audioElement.currentTime);
      durationSpan.textContent = formatTime(audioElement.duration);
    }
  });

  progressBar.addEventListener('input', () => {
    const time = (progressBar.value / 100) * audioElement.duration;
    audioElement.currentTime = time;
  });

  volumeSlider.addEventListener('input', (e) => {
    audioElement.volume = e.target.value;
  });

  // Filtro por Categorías
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      activeCategory = item.dataset.category;
      renderTracks();
    });
  });

  // Búsqueda
  searchInput.addEventListener('input', renderTracks);

  // Formato MM:SS
  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }
});