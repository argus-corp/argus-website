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
            }, 500);
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

    tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8, delay: 0.1 })
      .to('.hero-line-inner', { opacity: 1, y: 0, duration: 1, stagger: 0.15 }, '-=0.5')
      .to('.hero-sub', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
      .to('.hero-stats-row', { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
      .to('.hero-cta', { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
      .to('.hero-scroll', { opacity: 1, duration: 0.8 }, '-=0.3');

    // Animate hero stat counters
    setTimeout(() => {
        document.querySelectorAll('.hero-stat-number[data-count]').forEach(el => {
            animateCounter(el, parseInt(el.dataset.count), 1500);
        });
    }, 800);
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
