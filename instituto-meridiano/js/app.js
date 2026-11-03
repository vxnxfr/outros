/**
 * INSTITUTO MERIDIANO - CORE APPLICATION CONTROLLER
 * Orquestração de animações, preloader, navegação suave, modais,
 * relógio institucional UTC-3 e microinterações de alto nível.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Instanciação dos Sistemas Centrais
  const cursor = new window.CustomCursor();
  const matrix = new window.KnowledgeMatrix();
  const tilt3d = new window.Tilt3DEngine();

  // 2. Preloader & Sequência de Entrada
  runPreloader();

  // 3. Relógio Institucional São Paulo UTC-3
  initClock();

  // 4. Smooth Scrolling (Lenis com fallback nativo)
  initSmoothScroll();

  // 5. Interação com Abas de Escolas & Cátedras
  initSchoolsFilter();

  // 6. Modal de Admissão & Candidatura 2027
  initAdmissionsModal();

  // 7. Sistema de Notificações Toast & Cópia de E-mail
  initClipboardAndToasts();

  // 8. Botão de Som
  initSoundToggle();

  // 9. Gatilho Manual do Modo ESC (para mobile e touch)
  initEscButton(matrix);
});

/* ==========================================================================
   PRELOADER
   ========================================================================== */
function runPreloader() {
  const preloader = document.getElementById('preloader');
  const percentEl = document.getElementById('preloader-percent');
  const statusEl = document.getElementById('preloader-status');

  if (!preloader || !percentEl || !statusEl) return;

  const phases = [
    { threshold: 25, text: '[ CARREGANDO PROTOCOLOS ACADÊMICOS ]' },
    { threshold: 55, text: '[ SINCRONIZANDO CÁTEDRAS & LABORATÓRIOS ]' },
    { threshold: 85, text: '[ CALIBRANDO DENSIDADE TIPOGRÁFICA ]' },
    { threshold: 100, text: '[ ENTRADA AUTORIZADA // BEM-VINDO AO MERIDIANO ]' }
  ];

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 6) + 3;
    if (progress > 100) progress = 100;

    percentEl.textContent = `${progress < 10 ? '0' : ''}${progress}%`;

    const currentPhase = phases.find(p => progress <= p.threshold) || phases[phases.length - 1];
    statusEl.textContent = currentPhase.text;

    if (progress === 100) {
      clearInterval(interval);
      setTimeout(() => {
        preloader.classList.add('loaded');
        triggerEntranceAnimations();
      }, 350);
    }
  }, 40);
}

function triggerEntranceAnimations() {
  const heroElements = document.querySelectorAll('.hero-reveal');
  heroElements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('visible');
    }, index * 120);
  });
}

/* ==========================================================================
   RELÓGIO INSTITUCIONAL UTC-3
   ========================================================================== */
function initClock() {
  const clockEl = document.getElementById('live-timecode');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    // UTC-3 São Paulo
    const options = {
      timeZone: 'America/Sao_Paulo',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    const timeStr = new Intl.DateTimeFormat('pt-BR', options).format(now);
    clockEl.textContent = `SÃO PAULO ${timeStr} BRT (UTC-3)`;
  }

  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   SMOOTH SCROLLING (Lenis ou Fallback)
   ========================================================================== */
function initSmoothScroll() {
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Anchor links smooth navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || !targetId) return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -60 });
        }
      });
    });
  } else {
    // Fallback nativo
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  // Scroll Header Shrink
  const nav = document.querySelector('.site-header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 100) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });
}

/* ==========================================================================
   FILTROS DAS CÁTEDRAS & EXPANSÃO DE EMENTA
   ========================================================================== */
function initSchoolsFilter() {
  const filterBtns = document.querySelectorAll('.school-filter-btn');
  const cards = document.querySelectorAll('.school-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      cards.forEach(card => {
        if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
          card.style.display = 'grid';
          card.classList.add('fade-in');
        } else {
          card.style.display = 'none';
          card.classList.remove('fade-in');
        }
      });

      if (window.soundEngine) window.soundEngine.playClick();
    });
  });

  // Accordion de Ementa dentro dos cards
  const ementaToggles = document.querySelectorAll('.toggle-ementa-btn');
  ementaToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = toggle.closest('.school-card');
      const details = card.querySelector('.school-extended-details');
      const isExpanded = details.classList.contains('expanded');

      if (isExpanded) {
        details.classList.remove('expanded');
        toggle.innerHTML = 'VER EMENTA DETALHADA <span>+</span>';
      } else {
        details.classList.add('expanded');
        toggle.innerHTML = 'RECOLHER EMENTA <span>-</span>';
      }

      if (window.soundEngine) window.soundEngine.playClick();
    });
  });
}

/* ==========================================================================
   MODAL DE ADMISSÃO (CANDIDATURA 2027)
   ========================================================================== */
function initAdmissionsModal() {
  const openBtns = document.querySelectorAll('.btn-open-admissions');
  const modal = document.getElementById('admissions-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const form = document.getElementById('admissions-form');
  const successState = document.getElementById('admissions-success');

  if (!modal) return;

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (window.soundEngine) window.soundEngine.playClick();
    });
  });

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (window.soundEngine) window.soundEngine.playClick();
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Submissão com geração de token institucional criptográfico
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const candidateName = form.querySelector('#cand-name').value;
      const schoolSelected = form.querySelector('#cand-school').value;

      // Gerador de Hash Fictício
      const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
      const token = `IM-2027-${schoolSelected}-${randomHex}`;

      document.getElementById('token-generated').textContent = token;
      document.getElementById('token-name').textContent = candidateName;

      form.style.display = 'none';
      successState.style.display = 'block';

      if (window.soundEngine) window.soundEngine.playSuccess();
      showToast(`Protocolo ${token} gerado com sucesso.`);
    });
  }

  // Reset modal when closing after success
  const resetBtn = document.getElementById('btn-reset-form');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      form.style.display = 'block';
      successState.style.display = 'none';
      closeModal();
    });
  }
}

/* ==========================================================================
   SISTEMA DE TOAST & CLIPBOARD
   ========================================================================== */
function initClipboardAndToasts() {
  const copyBtns = document.querySelectorAll('.btn-copy-clipboard');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Copiado para a área de transferência: ${textToCopy}`);
          if (window.soundEngine) window.soundEngine.playClick();
        }).catch(() => {
          showToast('Endereço copiado.');
        });
      }
    });
  });
}

function showToast(message) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `<span class="toast-dot"></span><span class="toast-text">${message}</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('visible');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3800);
}

/* ==========================================================================
   BOTÃO DE SOM (AUDIO ENGINE TOGGLE)
   ========================================================================== */
function initSoundToggle() {
  const soundBtn = document.getElementById('sound-toggle-btn');
  if (!soundBtn) return;

  soundBtn.addEventListener('click', () => {
    if (window.soundEngine) {
      const isEnabled = window.soundEngine.toggle();
      soundBtn.querySelector('.sound-status').textContent = isEnabled ? 'ON' : 'OFF';
      soundBtn.classList.toggle('active', isEnabled);
      showToast(`Áudio tátil procedural: ${isEnabled ? 'ATIVADO' : 'MUTADO'}`);
    }
  });
}

/* ==========================================================================
   BOTÃO MANUAL DO MODO ESC (TOPOLOGICAL MATRIX)
   ========================================================================== */
function initEscButton(matrix) {
  const escBtn = document.getElementById('manual-esc-trigger');
  const closeMatrixBtn = document.getElementById('matrix-close-btn');

  if (escBtn) {
    escBtn.addEventListener('click', () => {
      if (matrix) matrix.toggle();
    });
  }

  if (closeMatrixBtn) {
    closeMatrixBtn.addEventListener('click', () => {
      if (matrix) matrix.toggle();
    });
  }
}

