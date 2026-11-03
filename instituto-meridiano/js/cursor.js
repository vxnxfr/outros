/**
 * INSTITUTO MERIDIANO - CUSTOM CURSOR CONTROLLER
 * Sistema de cursor duplo com física de inércia (lerp), atração magnética
 * e morphing tipográfico contextual.
 */

class CustomCursor {
  constructor() {
    this.dot = document.querySelector('.cursor-dot');
    this.ring = document.querySelector('.cursor-ring');
    this.ringLabel = document.querySelector('.cursor-label');

    this.mouse = { x: -100, y: -100 };
    this.ringPos = { x: -100, y: -100 };
    this.targetScale = 1;
    this.currentScale = 1;
    this.isHovering = false;
    this.magneticEl = null;

    if (!this.dot || !this.ring) return;

    // Check if device supports fine hover
    if (window.matchMedia('(pointer: coarse)').matches) {
      document.body.classList.add('touch-device');
      return;
    }

    this.init();
  }

  init() {
    window.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: true });
    document.addEventListener('mouseleave', () => this.onMouseLeave());
    document.addEventListener('mouseenter', () => this.onMouseEnter());

    // Observe hover targets
    this.setupMagneticAndHover();

    // Start render loop
    requestAnimationFrame(() => this.render());
  }

  onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;

    // Immediate placement of center dot
    this.dot.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0)`;

    if (this.ringPos.x === -100) {
      this.ringPos.x = this.mouse.x;
      this.ringPos.y = this.mouse.y;
    }
  }

  onMouseLeave() {
    this.dot.style.opacity = '0';
    this.ring.style.opacity = '0';
  }

  onMouseEnter() {
    this.dot.style.opacity = '1';
    this.ring.style.opacity = '1';
  }

  setupMagneticAndHover() {
    const interactiveElements = document.querySelectorAll('a, button, [data-cursor], [data-magnetic], .interactive-card');

    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', (e) => {
        this.isHovering = true;
        const cursorType = el.getAttribute('data-cursor') || 'hover';
        const labelText = el.getAttribute('data-cursor-label') || '';

        if (labelText) {
          this.ringLabel.textContent = labelText;
          this.ring.classList.add('has-label');
          this.targetScale = 2.4;
        } else if (cursorType === 'card') {
          this.targetScale = 1.8;
          this.ring.classList.add('card-mode');
        } else {
          this.targetScale = 1.5;
          this.ring.classList.add('link-mode');
        }

        // Magnetic target tracking
        if (el.hasAttribute('data-magnetic')) {
          this.magneticEl = el;
        }

        if (window.soundEngine) {
          window.soundEngine.playHover();
        }
      });

      el.addEventListener('mousemove', (e) => {
        if (this.magneticEl === el) {
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const deltaX = (e.clientX - centerX) * 0.25;
          const deltaY = (e.clientY - centerY) * 0.25;
          el.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
        }
      });

      el.addEventListener('mouseleave', () => {
        this.isHovering = false;
        this.targetScale = 1;
        this.ring.classList.remove('has-label', 'card-mode', 'link-mode');
        this.ringLabel.textContent = '';

        if (this.magneticEl === el) {
          el.style.transform = 'translate3d(0, 0, 0)';
          this.magneticEl = null;
        }
      });

      el.addEventListener('click', () => {
        if (window.soundEngine) {
          window.soundEngine.playClick();
        }
      });
    });
  }

  render() {
    // Lerp outer ring
    const ease = 0.15;
    this.ringPos.x += (this.mouse.x - this.ringPos.x) * ease;
    this.ringPos.y += (this.mouse.y - this.ringPos.y) * ease;

    this.currentScale += (this.targetScale - this.currentScale) * 0.2;

    this.ring.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0) scale(${this.currentScale})`;

    requestAnimationFrame(() => this.render());
  }
}

window.CustomCursor = CustomCursor;

