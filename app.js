/* ================================================================
   ARGUS — Main Application Scripts
   Preloader, Cursor, Magnetic, GSAP ScrollTrigger, Counters
   ================================================================ */

gsap.registerPlugin(ScrollTrigger);

// ==================== PRELOADER ====================
(function initPreloader() {
    const preloader = document.getElementById('preloader');
    const bar = document.getElementById('preloaderBar');
    const pct = document.getElementById('preloaderPct');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                preloader.classList.add('hidden');
                document.body.style.overflow = '';
                initHeroAnimations();
                initScrollAnimations();
            }, 200);
        }
        bar.style.width = progress + '%';
        pct.textContent = Math.floor(progress) + '%';
    }, 70);

    document.body.style.overflow = 'hidden';
})();

// ==================== CUSTOM CURSOR ====================
(function initCursor() {
    if (window.innerWidth <= 768) return;
    const cursor = document.getElementById('cursor');
    if (!cursor) return;
    const dot = cursor.querySelector('.cursor-dot');
    const outline = cursor.querySelector('.cursor-outline');

    let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0, outlineX = 0, outlineY = 0;

    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
    document.addEventListener('mousedown', () => cursor.classList.add('click'));
    document.addEventListener('mouseup', () => cursor.classList.remove('click'));

    document.querySelectorAll('a, button, [data-magnetic], .problem-card, .solution-card, .impact-card, .future-card').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    function animate() {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        outlineX += (mouseX - outlineX) * 0.1;
        outlineY += (mouseY - outlineY) * 0.1;
        dot.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
        outline.style.transform = `translate(${outlineX}px, ${outlineY}px)`;
        requestAnimationFrame(animate);
    }
    animate();
})();

// ==================== MAGNETIC ELEMENTS ====================
(function initMagnetic() {
    if (window.innerWidth <= 768) return;
    document.querySelectorAll('[data-magnetic]').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out' });
            const inner = el.querySelector('span');
            if (inner) gsap.to(inner, { x: x * 0.15, y: y * 0.15, duration: 0.4, ease: 'power2.out' });
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
            const inner = el.querySelector('span');
            if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
        });
    });
})();

// ==================== NAVBAR ====================
(function initNav() {
    const nav = document.getElementById('navbar');
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Active link highlighting
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-link');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => {
            const top = s.offsetTop - 200;
            if (window.scrollY >= top) current = s.getAttribute('id');
        });
        navLinks.forEach(l => {
            l.classList.remove('active');
            if (l.getAttribute('href') === '#' + current) l.classList.add('active');
        });
    });

    // Mobile menu
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
        mobileMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                menuBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
    }
})();

// ==================== HERO ANIMATIONS ====================
function initHeroAnimations() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Logo starts animating immediately (at time 0)
    tl.fromTo('.hero-logo-visual', { opacity: 0, scale: 0.85, x: 40 },
        { opacity: 1, scale: 1, x: 0, duration: 1.4, ease: 'power3.out' }, 0);

    // Draw logo strokes right away too
    tl.fromTo('.logo-face, .logo-hex', { strokeDashoffset: 2000 },
        { strokeDashoffset: 0, duration: 2, stagger: 0.2, ease: 'power2.inOut' }, 0);
    tl.fromTo('.logo-text path', { strokeDashoffset: 800 },
        { strokeDashoffset: 0, duration: 1.5, stagger: 0.1, ease: 'power2.inOut' }, 0.3);

    // Text content cascades in alongside
    tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8 }, 0.05)
      .to('.hero-line-inner', { opacity: 1, y: 0, duration: 1, stagger: 0.15 }, 0.15)
      .to('.hero-sub', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
      .to('.hero-stats-row', { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
      .to('.hero-cta', { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
      .to('.hero-scroll', { opacity: 1, duration: 0.8 }, '-=0.3')
      .call(() => initTypingEffect(), null, '-=0.3');

    // Animate hero stat counters
    setTimeout(() => {
        document.querySelectorAll('.hero-stat-number[data-count]').forEach(el => {
            animateCounter(el, parseInt(el.dataset.count), 1500);
        });
    }, 800);
}

// ==================== TYPING EFFECT ====================
function initTypingEffect() {
    const el = document.getElementById('typingWord');
    if (!el) return;
    const words = ['Perfectly.', 'Obsessively.', 'Without Blinking.', 'Like a Hawk.', 'At Machine Speed.', 'No Coffee Needed.'];
    let wordIndex = 0;
    let charIndex = words[0].length;
    let isDeleting = false;
    const typeSpeed = 80;
    const deleteSpeed = 50;
    const pauseAfterType = 2200;
    const pauseAfterDelete = 400;

    function tick() {
        const currentWord = words[wordIndex];
        if (!isDeleting) {
            charIndex++;
            el.textContent = currentWord.substring(0, charIndex);
            if (charIndex === currentWord.length) {
                isDeleting = true;
                setTimeout(tick, pauseAfterType);
                return;
            }
            setTimeout(tick, typeSpeed);
        } else {
            charIndex--;
            el.textContent = currentWord.substring(0, charIndex);
            if (charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(tick, pauseAfterDelete);
                return;
            }
            setTimeout(tick, deleteSpeed);
        }
    }

    // Start deleting after first pause
    setTimeout(() => {
        isDeleting = true;
        tick();
    }, pauseAfterType);
}

// ==================== SCROLL ANIMATIONS ====================
function initScrollAnimations() {
    // Generic data-animate elements
    document.querySelectorAll('[data-animate]').forEach(el => {
        ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            onEnter: () => el.classList.add('in-view'),
        });
    });

    // Counter animations
    document.querySelectorAll('.count-up[data-count]').forEach(el => {
        ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: () => animateCounter(el, parseInt(el.dataset.count), 2000),
        });
    });

    // Parallax for hero bg
    gsap.to('.hero-bg-canvas', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
        },
        opacity: 0,
        y: -100,
    });

    // Future timeline items — staggered reveal with SVG draw-in
    gsap.utils.toArray('.future-item').forEach((item, i) => {
        gsap.fromTo(item, { opacity: 0, y: 50, x: -30 }, {
            scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                toggleActions: 'play none none none',
            },
            opacity: 1, y: 0, x: 0,
            duration: 1.0,
            delay: i * 0.2,
            ease: 'power3.out',
            onComplete: () => {
                item.classList.add('in-view');
                // Activate marker dot with pulse
                const dot = item.querySelector('.future-marker-dot');
                if (dot) {
                    dot.style.borderColor = 'var(--accent)';
                    dot.style.background = 'var(--accent)';
                    dot.style.boxShadow = '0 0 12px var(--accent-glow-strong)';
                }
                const ping = item.querySelector('.future-marker-ping');
                if (ping) ping.style.animation = 'markerPing 2s cubic-bezier(0,0,0.2,1) infinite';
            },
        });
    });

    // Future timeline fill — grows as you scroll through the section
    const timelineFill = document.getElementById('futureTimelineFill');
    if (timelineFill) {
        ScrollTrigger.create({
            trigger: '.future-timeline',
            start: 'top 80%',
            end: 'bottom 40%',
            onUpdate: (self) => {
                timelineFill.style.height = (self.progress * 100) + '%';
            }
        });
    }

    // Future tech tags — staggered bounce-in
    gsap.fromTo('.future-tech', { opacity: 0, y: 30 }, {
        scrollTrigger: {
            trigger: '.future-tech',
            start: 'top 85%',
        },
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        onComplete: function() {
            document.querySelector('.future-tech')?.classList.add('in-view');
            // Stagger each tag with bounce
            document.querySelectorAll('.future-tech-tags span').forEach((tag, j) => {
                setTimeout(() => {
                    tag.classList.add('in-view');
                }, j * 80);
            });
        }
    });

    // Future floating particles canvas
    initFutureParticles();

    // Timer animation in solution section
    const timerEl = document.getElementById('timerNumber');
    if (timerEl) {
        ScrollTrigger.create({
            trigger: '.solution-headline',
            start: 'top 80%',
            once: true,
            onEnter: () => {
                gsap.fromTo(timerEl, { innerHTML: '0' }, {
                    innerHTML: 3,
                    duration: 1.5,
                    ease: 'power2.out',
                    snap: { innerHTML: 1 },
                    onUpdate: function() {
                        timerEl.textContent = Math.round(gsap.getProperty(timerEl, 'innerHTML'));
                    }
                });
            }
        });
    }
}

// ==================== CONVEYOR BELT — JS-DRIVEN SHIRTS ====================
(function initConveyor() {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const container = document.getElementById('conveyorShirts');
    if (!container) return;

    // ---- Path definitions (must match the SVG <path> elements) ----
    const SCANNER_X = 330; // x-position of scanner center

    // Pass path: straight line 20→850 at y=100
    function passPos(t) {
        return { x: 20 + t * 830, y: 100 };
    }
    const PASS_SCAN_T = (SCANNER_X - 20) / 830; // ~0.373

    // Fail loop: 5 segments — right → down → left → up → nudge left
    const failSegs = [
        { x0: 20, y0: 100, x1: 560, y1: 100, len: 540 },
        { x0: 560, y0: 100, x1: 560, y1: 230, len: 130 },
        { x0: 560, y0: 230, x1: 40,  y1: 230, len: 520 },
        { x0: 40,  y0: 230, x1: 40,  y1: 100, len: 130 },
        { x0: 40,  y0: 100, x1: 20,  y1: 100, len: 20  },
    ];
    const failTotal = failSegs.reduce((s, seg) => s + seg.len, 0); // 1340
    const FAIL_SCAN_T = (SCANNER_X - 20) / failTotal; // ~0.231

    function failPos(t) {
        var d = t * failTotal;
        for (var i = 0; i < failSegs.length; i++) {
            var seg = failSegs[i];
            if (d <= seg.len) {
                var f = d / seg.len;
                return { x: seg.x0 + (seg.x1 - seg.x0) * f, y: seg.y0 + (seg.y1 - seg.y0) * f };
            }
            d -= seg.len;
        }
        return { x: 20, y: 100 };
    }

    // ---- T-shirt SVG template ----
    var SHIRT_D = 'M0-20 l-12-8 -8,12 9,5 v20 h22 v-20 l9-5 -8-12z';
    var WHITE = '#888888';
    var GREEN = '#00E5A0';
    var RED   = '#FF6B6B';
    var SCAN_PAUSE = 0.9; // seconds to pause under scanner

    // ---- Shirt object pool ----
    var shirts = [];
    var nextId = 0;

    function createShirtSVG() {
        var g = document.createElementNS(SVG_NS, 'g');
        var path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', SHIRT_D);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', WHITE);
        path.setAttribute('stroke-width', '1.2');
        path.setAttribute('stroke-linejoin', 'round');

        var mark = document.createElementNS(SVG_NS, 'text');
        mark.setAttribute('x', '0');
        mark.setAttribute('y', '5');
        mark.setAttribute('text-anchor', 'middle');
        mark.setAttribute('font-family', 'var(--font-mono)');
        mark.setAttribute('font-size', '14');
        mark.setAttribute('font-weight', '700');
        mark.setAttribute('opacity', '0');

        // Scan beam overlay (two horizontal lines that sweep during scan)
        var scanBeam1 = document.createElementNS(SVG_NS, 'line');
        scanBeam1.setAttribute('x1', '-16'); scanBeam1.setAttribute('x2', '16');
        scanBeam1.setAttribute('y1', '0'); scanBeam1.setAttribute('y2', '0');
        scanBeam1.setAttribute('stroke', GREEN); scanBeam1.setAttribute('stroke-width', '1.2');
        scanBeam1.setAttribute('stroke-linecap', 'round'); scanBeam1.setAttribute('opacity', '0');

        var flash = document.createElementNS(SVG_NS, 'circle');
        flash.setAttribute('cx', '0');
        flash.setAttribute('cy', '0');
        flash.setAttribute('r', '14');
        flash.setAttribute('fill', 'none');
        flash.setAttribute('stroke-width', '1');
        flash.setAttribute('opacity', '0');

        // Scan box outline (brief highlight rectangle)
        var scanBox = document.createElementNS(SVG_NS, 'rect');
        scanBox.setAttribute('x', '-18'); scanBox.setAttribute('y', '-26');
        scanBox.setAttribute('width', '36'); scanBox.setAttribute('height', '52');
        scanBox.setAttribute('rx', '3');
        scanBox.setAttribute('fill', 'none'); scanBox.setAttribute('stroke', GREEN);
        scanBox.setAttribute('stroke-width', '0.8'); scanBox.setAttribute('opacity', '0');
        scanBox.setAttribute('stroke-dasharray', '4 3');

        g.appendChild(path);
        g.appendChild(scanBeam1);
        g.appendChild(scanBox);
        g.appendChild(mark);
        g.appendChild(flash);
        container.appendChild(g);

        return { g: g, path: path, mark: mark, flash: flash, scanBeam: scanBeam1, scanBox: scanBox };
    }

    function spawnShirt(pass) {
        var svg = createShirtSVG();
        var dur = pass ? 5.5 : 9.0;
        var scanT = pass ? PASS_SCAN_T : FAIL_SCAN_T;
        var color = pass ? GREEN : RED;
        var symbol = pass ? '✓' : '✗';
        var posFn = pass ? passPos : failPos;

        // Set scan beam color to match result
        svg.scanBeam.setAttribute('stroke', color);
        svg.scanBox.setAttribute('stroke', color);

        shirts.push({
            id: nextId++,
            svg: svg,
            pass: pass,
            t: 0,
            dur: dur,
            scanT: scanT,
            color: color,
            symbol: symbol,
            posFn: posFn,
            // State machine: 'moving' → 'scanning' → 'scanned'
            state: 'moving',
            scanTimer: 0,    // time spent in scanning state
            flashT: 0,
        });
    }

    // ---- Spawn pattern: ~1.5-2 shirts/sec, repeating pass/fail sequence ----
    var pattern = [true, true, false, true, true, true, false];
    var patIdx = 0;
    var spawnInterval = 700;
    var lastSpawn = 0;

    // ---- Animation loop ----
    var running = false;
    var lastTs = 0;

    function tick(ts) {
        if (!running) return;

        var dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 1 / 60;
        lastTs = ts;

        // Spawn new shirts at interval
        if (ts - lastSpawn > spawnInterval) {
            spawnShirt(pattern[patIdx % pattern.length]);
            patIdx++;
            lastSpawn = ts;
        }

        var toRemove = [];

        for (var i = 0; i < shirts.length; i++) {
            var s = shirts[i];

            if (s.state === 'moving') {
                s.t += dt / s.dur;

                // Reached scanner position? → pause and start scan
                if (s.t >= s.scanT) {
                    s.t = s.scanT; // snap to exact scanner position
                    s.state = 'scanning';
                    s.scanTimer = 0;
                    // Show scan visuals
                    s.svg.scanBox.setAttribute('opacity', '0.6');
                }
            } else if (s.state === 'scanning') {
                s.scanTimer += dt;
                var sp = s.scanTimer / SCAN_PAUSE; // 0→1 over scan duration

                // Animate scan beam sweeping up and down over the shirt
                var beamY = -22 + Math.sin(sp * Math.PI * 2.5) * 22;
                s.svg.scanBeam.setAttribute('y1', beamY.toFixed(1));
                s.svg.scanBeam.setAttribute('y2', beamY.toFixed(1));
                var beamOpacity = Math.sin(sp * Math.PI) * 0.8;
                s.svg.scanBeam.setAttribute('opacity', beamOpacity.toFixed(2));

                // Pulsing scan box
                s.svg.scanBox.setAttribute('opacity', (0.3 + Math.sin(sp * Math.PI * 3) * 0.3).toFixed(2));

                // Scan complete → colorify and resume
                if (s.scanTimer >= SCAN_PAUSE) {
                    s.state = 'scanned';
                    // Apply color
                    s.svg.path.setAttribute('stroke', s.color);
                    s.svg.mark.textContent = s.symbol;
                    s.svg.mark.setAttribute('fill', s.color);
                    s.svg.mark.setAttribute('opacity', '1');
                    s.svg.flash.setAttribute('stroke', s.color);
                    s.flashT = 0.001;
                    // Hide scan visuals
                    s.svg.scanBeam.setAttribute('opacity', '0');
                    s.svg.scanBox.setAttribute('opacity', '0');
                }
            } else {
                // 'scanned' — continue moving
                s.t += dt / s.dur;
            }

            if (s.t >= 1) {
                container.removeChild(s.svg.g);
                toRemove.push(i);
                continue;
            }

            // Position
            var pos = s.posFn(s.t);
            s.svg.g.setAttribute('transform', 'translate(' + pos.x.toFixed(1) + ',' + pos.y.toFixed(1) + ')');

            // Flash animation (quick expand & fade over 0.4s)
            if (s.flashT > 0) {
                s.flashT += dt;
                var fp = Math.min(s.flashT / 0.4, 1);
                var fr = 14 + fp * 14;
                var fo = 0.7 * (1 - fp);
                s.svg.flash.setAttribute('r', fr.toFixed(1));
                s.svg.flash.setAttribute('opacity', fo.toFixed(2));
                if (fp >= 1) s.flashT = -1;
            }

            // Fail shirts: fade mark back to hidden on return belt portion
            if (!s.pass && s.state === 'scanned' && s.t > 0.65) {
                var fadeP = Math.min((s.t - 0.65) / 0.15, 1);
                s.svg.path.setAttribute('stroke', WHITE);
                s.svg.mark.setAttribute('opacity', String(1 - fadeP));
            }
        }

        for (var j = toRemove.length - 1; j >= 0; j--) {
            shirts.splice(toRemove[j], 1);
        }

        requestAnimationFrame(tick);
    }

    // Start when section is visible, pause when off-screen
    ScrollTrigger.create({
        trigger: '.conveyor-illustration',
        start: 'top bottom',
        end: 'bottom top',
        onEnter:     function() { running = true; lastTs = 0; lastSpawn = performance.now(); requestAnimationFrame(tick); },
        onLeave:     function() { running = false; },
        onEnterBack: function() { running = true; lastTs = 0; lastSpawn = performance.now(); requestAnimationFrame(tick); },
        onLeaveBack: function() { running = false; },
    });
})();

// ==================== COUNTER ANIMATION ====================
function animateCounter(el, target, duration = 2000) {
    const start = performance.now();
    const initial = 0;

    function step(timestamp) {
        const progress = Math.min((timestamp - start) / duration, 1);
        // Ease out quart
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(initial + (target - initial) * ease);
        el.textContent = current;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ==================== FUTURE FLOATING PARTICLES ====================
function initFutureParticles() {
    const canvas = document.getElementById('futureParticles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const section = canvas.closest('.future');
    let particles = [];
    let animId = null;
    let isVisible = false;

    function resize() {
        canvas.width = section.clientWidth;
        canvas.height = section.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const COUNT = 50;
    for (let i = 0; i < COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -Math.random() * 0.4 - 0.1,
            r: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.3 + 0.05,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.02 + 0.008,
        });
    }

    function draw() {
        if (!isVisible) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += p.pulseSpeed;

            // Wrap around
            if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;

            const glow = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));

            // Outer glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 229, 160, ${glow * 0.15})`;
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 229, 160, ${glow})`;
            ctx.fill();
        });

        // Draw faint connecting lines between nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    const lineAlpha = (1 - dist / 120) * 0.06;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 229, 160, ${lineAlpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        animId = requestAnimationFrame(draw);
    }

    // Only animate when section is in viewport
    ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => { isVisible = true; draw(); },
        onLeave: () => { isVisible = false; if (animId) cancelAnimationFrame(animId); },
        onEnterBack: () => { isVisible = true; draw(); },
        onLeaveBack: () => { isVisible = false; if (animId) cancelAnimationFrame(animId); },
    });
}
