/**
 * INSTITUTO MERIDIANO - 3D PREMIUM PERSPECTIVE & TILT ENGINE
 * Efeito 3D cinematográfico com profundidade multi-camada (preserve-3d),
 * reflexo especular dinâmico (glare sheen), atração inercial e relevo Z-index.
 */

class Tilt3DEngine {
  constructor() {
    this.cards = [];
    this.maxRotate = 16; // Graus máximos de rotação
    this.maxTranslateZ = 45; // Profundidade do pop-up em pixels
    this.init();
  }

  init() {
    const cardElements = document.querySelectorAll('[data-tilt-3d]');
    cardElements.forEach(el => this.setupCard(el));

    // Inicia loop de renderização física
    requestAnimationFrame(() => this.render());
  }

  setupCard(card) {
    const media = card.querySelector('.card-3d-media');
    let glare = card.querySelector('.card-3d-glare');

    if (media && !glare) {
      glare = document.createElement('div');
      glare.className = 'card-3d-glare';
      media.appendChild(glare);
    }

    const cardData = {
      el: card,
      glare: glare,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      currentScale: 1,
      targetScale: 1,
      isHovered: false,
      idlePhase: Math.random() * Math.PI * 2, // Deslocamento de fase aleatório para flutuação
      idleSpeed: 0.0015 + Math.random() * 0.001
    };

    // Eventos de Mouse
    card.addEventListener('mouseenter', () => {
      cardData.isHovered = true;
      cardData.targetScale = 1.04;
      if (window.soundEngine) window.soundEngine.playHover();
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xNorm = (x / rect.width) * 2 - 1; // -1 a 1
      const yNorm = (y / rect.height) * 2 - 1; // -1 a 1

      cardData.targetX = -yNorm * this.maxRotate;
      cardData.targetY = xNorm * this.maxRotate;

      if (glare) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 70%)`;
        glare.style.opacity = '1';
      }
    });

    card.addEventListener('mouseleave', () => {
      cardData.isHovered = false;
      cardData.targetX = 0;
      cardData.targetY = 0;
      cardData.targetScale = 1;

      if (glare) {
        glare.style.opacity = '0';
      }
    });

    // Suporte a Touch para Mobile
    card.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = card.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          const xNorm = (x / rect.width) * 2 - 1;
          const yNorm = (y / rect.height) * 2 - 1;
          cardData.targetX = -yNorm * (this.maxRotate * 0.7);
          cardData.targetY = xNorm * (this.maxRotate * 0.7);
        }
      }
    }, { passive: true });

    card.addEventListener('touchend', () => {
      cardData.targetX = 0;
      cardData.targetY = 0;
    });

    this.cards.push(cardData);
  }

  render() {
    const ease = 0.12;

    for (const card of this.cards) {
      if (!card.isHovered) {
        // Efeito sutil de respiração 3D quando em repouso (cinematic float)
        card.idlePhase += card.idleSpeed;
        const floatX = Math.sin(card.idlePhase) * 2.2;
        const floatY = Math.cos(card.idlePhase * 0.8) * 2.8;

        card.targetX = floatX;
        card.targetY = floatY;
      }

      card.currentX += (card.targetX - card.currentX) * ease;
      card.currentY += (card.targetY - card.currentY) * ease;
      card.currentScale += (card.targetScale - card.currentScale) * ease;

      // Aplicação da transformação 3D composta
      card.el.style.transform = `perspective(1200px) rotateX(${card.currentX.toFixed(2)}deg) rotateY(${card.currentY.toFixed(2)}deg) scale3d(${card.currentScale.toFixed(3)}, ${card.currentScale.toFixed(3)}, 1)`;
    }

    requestAnimationFrame(() => this.render());
  }
}

window.Tilt3DEngine = Tilt3DEngine;

