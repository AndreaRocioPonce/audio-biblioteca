document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Iconos Lucide
  lucide.createIcons();

  // Elementos DOM
  const audioList = document.getElementById('audioList');
  const uploadForm = document.getElementById('uploadForm');
  const uploadModal = document.getElementById('uploadModal');
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const searchInput = document.getElementById('searchInput');
  const navItems = document.querySelectorAll('.nav-menu li');
  const modalTitle = document.getElementById('modalTitle');
  const saveBtn = document.getElementById('saveBtn');

  // Drag & Drop DOM
  const dropZone = document.getElementById('dropZone');
  const audioFileInput = document.getElementById('audioFileInput');
  const fileSelectedInfo = document.getElementById('fileSelectedInfo');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const dropZoneGroup = document.getElementById('dropZoneGroup');

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
  let editingTrackId = null;
  let selectedFile = null;
  let activeCategory = 'all';

  // Abrir modal para NUEVO audio
  openModalBtn.addEventListener('click', () => {
    resetModalForm();
    modalTitle.textContent = "Agregar nuevo audio";
    saveBtn.textContent = "Guardar en Biblioteca";
    uploadModal.classList.add('active');
  });

  // Cerrar modal
  closeModalBtn.addEventListener('click', () => {
    uploadModal.classList.remove('active');
    resetModalForm();
  });

  // Resetear Formulario Modal
  function resetModalForm() {
    uploadForm.reset();
    editingTrackId = null;
    selectedFile = null;
    fileSelectedInfo.style.display = "none";
    fileNameDisplay.textContent = "";
    audioFileInput.required = true;
  }

  // --- LÓGICA DRAG & DROP ---
  dropZone.addEventListener('click', () => audioFileInput.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('audio/')) {
      handleFileSelected(files[0]);
    } else {
      alert("Por favor arrastra un archivo de audio válido (MP3, WAV, etc.).");
    }
  });

  audioFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    fileSelectedInfo.style.display = "flex";

    // Auto-completar título con el nombre del archivo si está vacío
    const titleInput = document.getElementById('audioTitleInput');
    if (!titleInput.value) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      titleInput.value = cleanName;
    }
  }

  // --- GUARDAR / EDITAR AUDIO ---
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('audioTitleInput').value.trim();
    const category = document.getElementById('audioCategoryInput').value;
    const tags = document.getElementById('audioTagsInput').value.split(',').map(t => t.trim()).filter(t => t);

    if (editingTrackId) {
      // MODO EDICIÓN
      const track = tracks.find(t => t.id === editingTrackId);
      if (track) {
        track.title = title;
        track.category = category;
        track.tags = tags;

        // Si se seleccionó/arrastró un archivo nuevo durante la edición
        if (selectedFile) {
          track.fileUrl = URL.createObjectURL(selectedFile);
          track.fileName = selectedFile.name;
        }

        // Si se está reproduciendo este audio actualmente, actualizar la barra inferior
        if (playerTitle.textContent === track.title || audioElement.src === track.fileUrl) {
          playerTitle.textContent = track.title;
          playerCategory.textContent = track.category;
        }
      }
    } else {
      // MODO CREACIÓN NUEVA
      if (!selectedFile) {
        alert("Debes arrastrar o seleccionar un archivo de audio.");
        return;
      }

      const track = {
        id: Date.now(),
        title: title || selectedFile.name,
        category,
        tags,
        fileUrl: URL.createObjectURL(selectedFile),
        fileName: selectedFile.name
      };

      tracks.push(track);
    }

    renderTracks();
    uploadModal.classList.remove('active');
    resetModalForm();
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

    if (filteredTracks.length === 0) {
      audioList.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No hay audios guardados en esta categoría. Haz clic en "Subir Audio" y arrastra un archivo.
          </td>
        </tr>
      `;
      return;
    }

    filteredTracks.forEach((track, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(track.title)}</strong></td>
        <td>${escapeHtml(track.category)}</td>
        <td>${track.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon play-icon" title="Reproducir" onclick="playTrack(${track.id})">
              <i data-lucide="play-circle"></i>
            </button>
            <button class="btn-icon" title="Editar Información" onclick="openEditModal(${track.id})">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="btn-icon delete-icon" title="Eliminar" onclick="deleteTrack(${track.id})">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;
      audioList.appendChild(tr);
    });

    lucide.createIcons();
  }

  // --- EDITAR TRACK ---
  window.openEditModal = function(id) {
    const track = tracks.find(t => t.id === id);
    if (!track) return;

    editingTrackId = track.id;
    modalTitle.textContent = "Editar información del audio";
    saveBtn.textContent = "Guardar Cambios";

    document.getElementById('audioTitleInput').value = track.title;
    document.getElementById('audioCategoryInput').value = track.category;
    document.getElementById('audioTagsInput').value = track.tags.join(', ');

    audioFileInput.required = false;
    fileNameDisplay.textContent = `Archivo actual: ${track.fileName || 'Audio cargado'}`;
    fileSelectedInfo.style.display = "flex";

    uploadModal.classList.add('active');
  };

  // --- ELIMINAR TRACK ---
  window.deleteTrack = function(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este audio de la biblioteca?")) {
      tracks = tracks.filter(t => t.id !== id);
      renderTracks();
    }
  };

  // --- REPRODUCCIÓN DE AUDIO ---
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

  // Auxiliares
  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Render inicial
  renderTracks();
});
