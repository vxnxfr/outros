/**
 * INSTITUTO MERIDIANO - TOPOLOGICAL MATRIX (MODO CARTOGRÁFICO // ESC)
 * Visualizador em Canvas 2D de alta densidade da malha epistêmica interdisciplinar.
 * Renderiza nós de conhecimento, partículas de sinal, forças elásticas e inspeção interativa.
 */

class KnowledgeMatrix {
  constructor() {
    this.container = document.getElementById('matrix-overlay');
    this.canvas = document.getElementById('matrix-canvas');
    if (!this.canvas || !this.container) return;

    this.ctx = this.canvas.getContext('2d');
    this.isActive = false;
    this.nodes = [];
    this.edges = [];
    this.signals = [];
    this.hoveredNode = null;
    this.draggedNode = null;
    this.mouse = { x: 0, y: 0 };
    this.detailPanel = document.getElementById('matrix-detail-panel');

    this.initGraph();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupListeners();
  }

  initGraph() {
    // 4 Cátedras Principais (Major Hubs)
    const hubs = [
      {
        id: 'c1',
        title: 'Computação Criativa & IA',
        code: 'CC-AI',
        xRatio: 0.28,
        yRatio: 0.32,
        color: '#10b981',
        radius: 24,
        type: 'hub',
        desc: 'Pesquisa em modelos fundacionais, cognição sintética e sistemas distribuídos autônomos.',
        fellow: 'Dra. Helena Valente (ex-DeepMind)'
      },
      {
        id: 'c2',
        title: 'Design Estratégico & Futuros',
        code: 'DS-FE',
        xRatio: 0.72,
        yRatio: 0.30,
        color: '#f59e0b',
        radius: 24,
        type: 'hub',
        desc: 'Intervenção material em ecologias complexas, design especulativo e interfaces planetárias.',
        fellow: 'Prof. Arthur Salles (Bienal de Milão)'
      },
      {
        id: 'c3',
        title: 'Arquitetura & Ecologias Vivas',
        code: 'AR-EV',
        xRatio: 0.32,
        yRatio: 0.70,
        color: '#06b6d4',
        radius: 24,
        type: 'hub',
        desc: 'Fabricação biomateriais, física de estruturas vivas e restauração bioclimática territorial.',
        fellow: 'Arq. Mariana Thorne (Pavilhão Brasil)'
      },
      {
        id: 'c4',
        title: 'Filosofia da Tecnologia & Mente',
        code: 'FL-CG',
        xRatio: 0.68,
        yRatio: 0.68,
        color: '#ec4899',
        radius: 24,
        type: 'hub',
        desc: 'Soberania epistêmica, epistemologia computacional e economia política da inteligência artificial.',
        fellow: 'Dr. Bento Alencastro (Sorbonne)'
      }
    ];

    // Sub-nós Interdisciplinares (Research Bridges)
    const bridges = [
      { id: 'b1', title: 'Neurociência Computacional', code: 'NC-01', xRatio: 0.40, yRatio: 0.20, color: '#93c5fd', radius: 12, type: 'bridge', targetHubs: ['c1', 'c4'] },
      { id: 'b2', title: 'Ética dos Modelos Autônomos', code: 'ET-02', xRatio: 0.50, yRatio: 0.48, color: '#fca5a5', radius: 14, type: 'bridge', targetHubs: ['c1', 'c2', 'c4'] },
      { id: 'b3', title: 'Biomateriais Generativos', code: 'BM-03', xRatio: 0.22, yRatio: 0.52, color: '#6ee7b7', radius: 13, type: 'bridge', targetHubs: ['c1', 'c3'] },
      { id: 'b4', title: 'Cartografia de Carbono & Rios', code: 'CR-04', xRatio: 0.52, yRatio: 0.78, color: '#67e8f9', radius: 13, type: 'bridge', targetHubs: ['c3', 'c2'] },
      { id: 'b5', title: 'Tipografia Crítica & Código', code: 'TC-05', xRatio: 0.56, yRatio: 0.25, color: '#fde047', radius: 12, type: 'bridge', targetHubs: ['c1', 'c2'] },
      { id: 'b6', title: 'Projeto Noema (BCI)', code: 'NOEMA', xRatio: 0.16, yRatio: 0.22, color: '#10b981', radius: 15, type: 'lab', targetHubs: ['c1'] },
      { id: 'b7', title: 'Protocolo Gaia-04', code: 'GAIA', xRatio: 0.18, yRatio: 0.82, color: '#06b6d4', radius: 15, type: 'lab', targetHubs: ['c3'] },
      { id: 'b8', title: 'Corpus Brasilis (142 Línguas)', code: 'CORPUS', xRatio: 0.82, yRatio: 0.82, color: '#ec4899', radius: 15, type: 'lab', targetHubs: ['c4', 'c1'] },
      { id: 'b9', title: 'Interfaces Planetárias', code: 'PLANET', xRatio: 0.84, yRatio: 0.22, color: '#f59e0b', radius: 15, type: 'lab', targetHubs: ['c2'] }
    ];

    this.rawNodes = [...hubs, ...bridges];
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);

    // Reposition nodes based on current dimensions
    this.nodes = this.rawNodes.map(n => {
      return {
        ...n,
        x: n.xRatio * this.width,
        y: n.yRatio * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        baseX: n.xRatio * this.width,
        baseY: n.yRatio * this.height
      };
    });

    // Rebuild edges
    this.edges = [];
    this.nodes.forEach(node => {
      if (node.targetHubs) {
        node.targetHubs.forEach(hubId => {
          const target = this.nodes.find(h => h.id === hubId);
          if (target) {
            this.edges.push({ source: node, target: target });
          }
        });
      }
    });

    // Cross-connect the major 4 hubs into an epistemic diamond
    const c1 = this.nodes.find(n => n.id === 'c1');
    const c2 = this.nodes.find(n => n.id === 'c2');
    const c3 = this.nodes.find(n => n.id === 'c3');
    const c4 = this.nodes.find(n => n.id === 'c4');
    if (c1 && c2 && c3 && c4) {
      this.edges.push({ source: c1, target: c2 });
      this.edges.push({ source: c2, target: c4 });
      this.edges.push({ source: c4, target: c3 });
      this.edges.push({ source: c3, target: c1 });
    }

    // Populate pulses
    this.signals = [];
    for (let i = 0; i < 16; i++) {
      const edge = this.edges[Math.floor(Math.random() * this.edges.length)];
      if (edge) {
        this.signals.push({
          edge: edge,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.005
        });
      }
    }
  }

  setupListeners() {
    // ESC key trigger
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        this.toggle();
      }
    });

    // Mouse movement inside canvas
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;

      if (this.draggedNode) {
        this.draggedNode.x = this.mouse.x;
        this.draggedNode.y = this.mouse.y;
        return;
      }

      // Check hover
      let found = null;
      for (const node of this.nodes) {
        const dx = this.mouse.x - node.x;
        const dy = this.mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < node.radius + 10) {
          found = node;
          break;
        }
      }

      if (found !== this.hoveredNode) {
        this.hoveredNode = found;
        this.updateDetailPanel(found);
        if (found && window.soundEngine) {
          window.soundEngine.playHover();
        }
      }
    });

    this.canvas.addEventListener('mousedown', () => {
      if (this.hoveredNode) {
        this.draggedNode = this.hoveredNode;
        if (window.soundEngine) window.soundEngine.playClick();
      }
    });

    window.addEventListener('mouseup', () => {
      this.draggedNode = null;
    });

    // Touch support for mobile canvas
    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.isActive) return;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = touch.clientX - rect.left;
      this.mouse.y = touch.clientY - rect.top;

      let found = null;
      for (const node of this.nodes) {
        const dx = this.mouse.x - node.x;
        const dy = this.mouse.y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < node.radius + 16) {
          found = node;
          break;
        }
      }
      if (found) {
        this.hoveredNode = found;
        this.updateDetailPanel(found);
      }
    }, { passive: true });
  }

  updateDetailPanel(node) {
    if (!this.detailPanel) return;
    if (!node) {
      this.detailPanel.classList.remove('visible');
      return;
    }

    const titleEl = this.detailPanel.querySelector('.matrix-detail-title');
    const codeEl = this.detailPanel.querySelector('.matrix-detail-code');
    const descEl = this.detailPanel.querySelector('.matrix-detail-desc');
    const metaEl = this.detailPanel.querySelector('.matrix-detail-meta');

    if (titleEl) titleEl.textContent = node.title;
    if (codeEl) codeEl.textContent = `[ID: ${node.code}] // TIPO: ${node.type.toUpperCase()}`;
    if (descEl) descEl.textContent = node.desc || 'Conexão epistêmica em produção experimental com projetos de graduação e doutorado.';
    if (metaEl) metaEl.textContent = node.fellow ? `Cátedra: ${node.fellow}` : 'Status: Conexão Interdisciplinar Aberta';

    this.detailPanel.classList.add('visible');
  }

  toggle() {
    this.isActive = !this.isActive;

    if (this.isActive) {
      this.container.classList.add('active');
      document.body.classList.add('matrix-mode-active');
      this.resize();
      if (window.soundEngine) window.soundEngine.playEscToggle(true);
      this.loop();
    } else {
      this.container.classList.remove('active');
      document.body.classList.remove('matrix-mode-active');
      if (window.soundEngine) window.soundEngine.playEscToggle(false);
    }
  }

  loop() {
    if (!this.isActive) return;

    this.update();
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  update() {
    // Gentle spring simulation towards base coordinates
    for (const node of this.nodes) {
      if (node === this.draggedNode) continue;

      node.x += node.vx;
      node.y += node.vy;

      // Elastic pull back to base
      const dx = node.baseX - node.x;
      const dy = node.baseY - node.y;
      node.vx += dx * 0.002;
      node.vy += dy * 0.002;

      // Damping
      node.vx *= 0.96;
      node.vy *= 0.96;
    }

    // Update signal pulses along edges
    for (const sig of this.signals) {
      sig.progress += sig.speed;
      if (sig.progress >= 1) {
        sig.progress = 0;
        sig.edge = this.edges[Math.floor(Math.random() * this.edges.length)];
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Background architectural technical grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    this.ctx.lineWidth = 1;
    const step = 64;
    for (let x = 0; x < this.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    // Render Edges
    for (const edge of this.edges) {
      const isConnectedToHovered = this.hoveredNode && 
        (edge.source === this.hoveredNode || edge.target === this.hoveredNode);

      this.ctx.beginPath();
      this.ctx.moveTo(edge.source.x, edge.source.y);
      this.ctx.lineTo(edge.target.x, edge.target.y);

      if (isConnectedToHovered) {
        this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        this.ctx.lineWidth = 2;
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        this.ctx.lineWidth = 1;
      }
      this.ctx.stroke();
    }

    // Render Signal Pulses
    for (const sig of this.signals) {
      if (!sig.edge) continue;
      const x = sig.edge.source.x + (sig.edge.target.x - sig.edge.source.x) * sig.progress;
      const y = sig.edge.source.y + (sig.edge.target.y - sig.edge.source.y) * sig.progress;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#00ff9d';
      this.ctx.shadowColor = '#00ff9d';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Render Nodes
    for (const node of this.nodes) {
      const isHovered = node === this.hoveredNode;

      // Glow halo
      if (isHovered || node.type === 'hub') {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius * (isHovered ? 1.6 : 1.3), 0, Math.PI * 2);
        this.ctx.fillStyle = `${node.color}22`;
        this.ctx.fill();
      }

      // Outer ring
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = isHovered ? '#ffffff' : node.color;
      this.ctx.lineWidth = isHovered ? 2.5 : 1.5;
      this.ctx.stroke();

      // Inner fill
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius * 0.45, 0, Math.PI * 2);
      this.ctx.fillStyle = isHovered ? '#ffffff' : node.color;
      this.ctx.fill();

      // Typography label
      this.ctx.font = node.type === 'hub' ? '600 13px "JetBrains Mono", monospace' : '400 11px "JetBrains Mono", monospace';
      this.ctx.fillStyle = isHovered ? '#ffffff' : '#b3b3b3';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.code, node.x, node.y + node.radius + 16);

      if (node.type === 'hub') {
        this.ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        this.ctx.fillText(node.title, node.x, node.y + node.radius + 30);
      }
    }
  }
}

window.KnowledgeMatrix = KnowledgeMatrix;

