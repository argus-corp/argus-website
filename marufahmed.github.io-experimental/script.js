/* ================================================================
   MARUF AHMED — PORTFOLIO SCRIPTS
   Custom cursor, particles, GSAP animations, typing effect,
   scroll-triggered reveals, magnetic buttons, counter animations
   ================================================================ */

// ==================== REGISTER GSAP PLUGINS ====================
gsap.registerPlugin(ScrollTrigger);

// ==================== PRELOADER ====================
(function initPreloader() {
    const preloader = document.getElementById('preloader');
    const counter = document.getElementById('preloaderCounter');
    const line = document.querySelector('.preloader-line');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 12;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                preloader.classList.add('hidden');
                document.body.style.overflow = '';
                initHeroAnimations();
            }, 400);
        }
        counter.textContent = Math.floor(progress);
        line.style.width = progress + '%';
    }, 80);

    document.body.style.overflow = 'hidden';
})();

// ==================== CUSTOM CURSOR ====================
(function initCursor() {
    if (window.innerWidth <= 768) return;

    const cursor = document.getElementById('cursor');
    const dot = cursor.querySelector('.cursor-dot');
    const outline = cursor.querySelector('.cursor-outline');

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let outlineX = 0, outlineY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    document.addEventListener('mousedown', () => cursor.classList.add('click'));
    document.addEventListener('mouseup', () => cursor.classList.remove('click'));

    // Hover effects
    const hoverElements = document.querySelectorAll('a, button, [data-magnetic], .project-card, .stat-card, .timeline-item, .whatido-card');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    function animateCursor() {
        // Smooth follow for dot
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;

        // Even smoother follow for outline
        outlineX += (mouseX - outlineX) * 0.1;
        outlineY += (mouseY - outlineY) * 0.1;

        dot.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
        outline.style.transform = `translate(${outlineX}px, ${outlineY}px)`;

        requestAnimationFrame(animateCursor);
    }
    animateCursor();
})();

// ==================== MAGNETIC ELEMENTS ====================
(function initMagnetic() {
    if (window.innerWidth <= 768) return;

    document.querySelectorAll('[data-magnetic]').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(el, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.4,
                ease: 'power2.out'
            });

            // Move inner span too
            const inner = el.querySelector('span');
            if (inner) {
                gsap.to(inner, {
                    x: x * 0.15,
                    y: y * 0.15,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            }
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: 'elastic.out(1, 0.3)'
            });

            const inner = el.querySelector('span');
            if (inner) {
                gsap.to(inner, {
                    x: 0,
                    y: 0,
                    duration: 0.7,
                    ease: 'elastic.out(1, 0.3)'
                });
            }
        });
    });
})();

// ==================== MESH GRADIENT BACKGROUND ====================
(function initMeshGradient() {
    const gradient = new Gradient();
    gradient.initGradient('#gradient-canvas');
})();

// ==================== HERO ANIMATIONS ====================
function initHeroAnimations() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.to('.hero-greeting', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.2
    })
        .to('.hero-first', {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power4.out'
        }, '-=0.4')
        .to('.hero-last', {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power4.out'
        }, '-=0.7')
        .to('.hero-title-wrapper', {
            opacity: 1,
            y: 0,
            duration: 0.8
        }, '-=0.5')
        .to('.hero-description', {
            opacity: 1,
            y: 0,
            duration: 0.8
        }, '-=0.5')
        .to('.hero-cta', {
            opacity: 1,
            y: 0,
            duration: 0.8
        }, '-=0.5')
        .to('.hero-scroll-indicator', {
            opacity: 1,
            y: 0,
            duration: 0.8
        }, '-=0.4');

    // Start typing effect
    initTypingEffect();
}

// ==================== TYPING EFFECT ====================
function initTypingEffect() {
    const words = [
        'AI Whisperer',
        'Pipeline Plumber',
        'Cloud Wrangler',
        'Model Trainer',
        'Stack Architect',
        'Bug Hunter',
        'Data Alchemist'
    ];

    // SVG icons matching each word — simple line-art that gets drawn in
    const svgIcons = [
        // AI Whisperer — brain/neural network
        `<svg viewBox="0 0 200 200"><circle cx="100" cy="60" r="30" class="svg-fill"/><circle cx="100" cy="60" r="30"/><circle cx="60" cy="120" r="18" class="svg-fill"/><circle cx="60" cy="120" r="18"/><circle cx="140" cy="120" r="18" class="svg-fill"/><circle cx="140" cy="120" r="18"/><circle cx="100" cy="160" r="14" class="svg-fill"/><circle cx="100" cy="160" r="14"/><line x1="100" y1="90" x2="60" y2="102"/><line x1="100" y1="90" x2="140" y2="102"/><line x1="60" y1="138" x2="100" y2="146"/><line x1="140" y1="138" x2="100" y2="146"/><circle cx="100" cy="60" r="5" style="fill:var(--accent);stroke:none;stroke-dasharray:0;stroke-dashoffset:0"/><circle cx="60" cy="120" r="4" style="fill:var(--accent);stroke:none;stroke-dasharray:0;stroke-dashoffset:0"/><circle cx="140" cy="120" r="4" style="fill:var(--accent);stroke:none;stroke-dasharray:0;stroke-dashoffset:0"/><circle cx="100" cy="160" r="3" style="fill:var(--accent);stroke:none;stroke-dasharray:0;stroke-dashoffset:0"/></svg>`,
        // Pipeline Plumber — pipes/flow
        `<svg viewBox="0 0 200 200"><rect x="20" y="60" width="50" height="30" rx="4" class="svg-fill"/><rect x="20" y="60" width="50" height="30" rx="4"/><line x1="70" y1="75" x2="110" y2="75"/><rect x="110" y="50" width="30" height="50" rx="4" class="svg-fill"/><rect x="110" y="50" width="30" height="50" rx="4"/><line x1="140" y1="65" x2="170" y2="65"/><line x1="140" y1="85" x2="170" y2="85"/><circle cx="178" cy="65" r="8" class="svg-fill"/><circle cx="178" cy="65" r="8"/><circle cx="178" cy="85" r="8" class="svg-fill"/><circle cx="178" cy="85" r="8"/><rect x="20" y="120" width="50" height="30" rx="4" class="svg-fill"/><rect x="20" y="120" width="50" height="30" rx="4"/><line x1="70" y1="135" x2="110" y2="135"/><rect x="110" y="120" width="60" height="30" rx="4" class="svg-fill"/><rect x="110" y="120" width="60" height="30" rx="4"/><line x1="125" y1="100" x2="125" y2="120"/></svg>`,
        // Cloud Wrangler — cloud shape
        `<svg viewBox="0 0 200 200"><path d="M50 130 A40 40 0 0 1 50 70 A30 30 0 0 1 100 50 A35 35 0 0 1 160 70 A25 25 0 0 1 160 130 Z" class="svg-fill"/><path d="M50 130 A40 40 0 0 1 50 70 A30 30 0 0 1 100 50 A35 35 0 0 1 160 70 A25 25 0 0 1 160 130 Z"/><line x1="80" y1="130" x2="80" y2="155"/><line x1="105" y1="130" x2="105" y2="165"/><line x1="130" y1="130" x2="130" y2="150"/><circle cx="80" cy="160" r="4" style="fill:var(--accent);stroke:none;stroke-dasharray:0;stroke-dashoffset:0"/><circle cx="105" cy="170" r="4" style="fill:var(--accent);stroke:none;stroke-dasharray:0;stroke-dashoffset:0"/><circle cx="130" cy="155" r="4" style="fill:var(--accent);stroke:none;stroke-dasharray:0;stroke-dashoffset:0"/></svg>`,
        // Model Trainer — target/bullseye
        `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="70" class="svg-fill"/><circle cx="100" cy="100" r="70"/><circle cx="100" cy="100" r="50"/><circle cx="100" cy="100" r="30"/><circle cx="100" cy="100" r="10" style="fill:var(--accent);stroke:none;stroke-dasharray:0;stroke-dashoffset:0"/><line x1="100" y1="20" x2="100" y2="30"/><line x1="100" y1="170" x2="100" y2="180"/><line x1="20" y1="100" x2="30" y2="100"/><line x1="170" y1="100" x2="180" y2="100"/></svg>`,
        // Stack Architect — layered blocks
        `<svg viewBox="0 0 200 200"><rect x="50" y="130" width="100" height="35" rx="4" class="svg-fill"/><rect x="50" y="130" width="100" height="35" rx="4"/><rect x="60" y="90" width="80" height="35" rx="4" class="svg-fill"/><rect x="60" y="90" width="80" height="35" rx="4"/><rect x="70" y="50" width="60" height="35" rx="4" class="svg-fill"/><rect x="70" y="50" width="60" height="35" rx="4"/><line x1="100" y1="40" x2="100" y2="20"/><polyline points="90,28 100,18 110,28"/></svg>`,
        // Bug Hunter — magnifying glass with bug
        `<svg viewBox="0 0 200 200"><circle cx="90" cy="90" r="50" class="svg-fill"/><circle cx="90" cy="90" r="50"/><line x1="126" y1="126" x2="170" y2="170"/><circle cx="90" cy="85" r="15"/><line x1="90" y1="70" x2="90" y2="100"/><line x1="78" y1="80" x2="75" y2="70"/><line x1="102" y1="80" x2="105" y2="70"/><line x1="78" y1="90" x2="72" y2="95"/><line x1="102" y1="90" x2="108" y2="95"/></svg>`,
        // Data Alchemist — flask/beaker
        `<svg viewBox="0 0 200 200"><path d="M80 30 L80 90 L45 160 A10 10 0 0 0 55 175 L145 175 A10 10 0 0 0 155 160 L120 90 L120 30" class="svg-fill"/><path d="M80 30 L80 90 L45 160 A10 10 0 0 0 55 175 L145 175 A10 10 0 0 0 155 160 L120 90 L120 30"/><line x1="75" y1="30" x2="125" y2="30"/><line x1="60" y1="140" x2="140" y2="140"/><circle cx="85" cy="155" r="6" style="fill:var(--accent);stroke:none;stroke-dasharray:0;stroke-dashoffset:0"/><circle cx="110" cy="150" r="4" style="fill:rgba(167,139,250,0.6);stroke:none;stroke-dasharray:0;stroke-dashoffset:0"/><circle cx="95" cy="125" r="5" style="fill:rgba(108,99,255,0.4);stroke:none;stroke-dasharray:0;stroke-dashoffset:0;opacity:0"/></svg>`
    ];

    const el = document.getElementById('typingText');
    const svgContainer = document.getElementById('heroSvgIcon');
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 80;

    // Set initial SVG
    if (svgContainer) {
        updateHeroSvg(0);
    }

    function updateHeroSvg(index) {
        if (!svgContainer) return;
        // Fade out old
        gsap.to(svgContainer, {
            opacity: 0,
            scale: 0.9,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                svgContainer.innerHTML = svgIcons[index] || '';
                // Animate SVG draw-in
                const paths = svgContainer.querySelectorAll('path, circle, line, polyline, rect');
                paths.forEach(p => {
                    const length = p.getTotalLength ? p.getTotalLength() : 800;
                    if (p.style.strokeDasharray !== '0') {
                        p.style.strokeDasharray = length;
                        p.style.strokeDashoffset = length;
                    }
                });
                // Fade in + draw
                gsap.to(svgContainer, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.4,
                    ease: 'power2.out'
                });
                paths.forEach((p, i) => {
                    if (p.style.strokeDasharray !== '0') {
                        gsap.to(p, {
                            strokeDashoffset: 0,
                            duration: 1.2,
                            delay: i * 0.05,
                            ease: 'power2.inOut'
                        });
                    }
                });
                // Gentle floating animation
                gsap.to(svgContainer, {
                    y: -8,
                    duration: 2,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1
                });
            }
        });
    }

    function type() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
            el.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 40;
        } else {
            el.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 80;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            // Update SVG on word change
            updateHeroSvg(wordIndex);
            typeSpeed = 300; // Pause before typing
        }

        setTimeout(type, typeSpeed);
    }

    type();
}

// ==================== DYNAMIC HERO NAME GRADIENT ====================
(function initHeroGradient() {
    if (window.innerWidth <= 768) return;

    const heroName = document.getElementById('heroName');
    const heroFirst = heroName ? heroName.querySelector('.hero-first') : null;
    if (!heroFirst) return;

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 360;
        const y = (e.clientY / window.innerHeight) * 100;
        heroFirst.style.background = `linear-gradient(${x}deg, #fff ${Math.max(0, 30 - y * 0.3)}%, #a8a3ff ${50 + y * 0.2}%, #6c63ff 100%)`;
        heroFirst.style.backgroundClip = 'text';
        heroFirst.style.webkitBackgroundClip = 'text';
        heroFirst.style.webkitTextFillColor = 'transparent';
    });
})();

// ==================== SCROLL REVEAL ANIMATIONS ====================
(function initScrollAnimations() {
    // Animate all [data-animate] elements
    document.querySelectorAll('[data-animate="fade-up"]').forEach(el => {
        ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                el.classList.add('animated');
            }
        });
    });

    // Timeline progress bar
    ScrollTrigger.create({
        trigger: '.timeline',
        start: 'top 80%',
        end: 'bottom 20%',
        onUpdate: (self) => {
            const progress = document.getElementById('timelineProgress');
            if (progress) {
                progress.style.height = (self.progress * 100) + '%';
            }
        }
    });

    // Navbar background on scroll
    ScrollTrigger.create({
        start: 100,
        onUpdate: (self) => {
            const nav = document.getElementById('navbar');
            if (self.direction === 1 && self.scroll() > 100) {
                nav.classList.add('scrolled');
            }
            if (self.scroll() <= 100) {
                nav.classList.remove('scrolled');
            }
        }
    });

    // Parallax hero elements on scroll
    gsap.to('.hero-name', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        },
        y: -80,
        opacity: 0
    });

    gsap.to('.hero-scroll-indicator', {
        scrollTrigger: {
            trigger: '.hero',
            start: '20% top',
            end: '40% top',
            scrub: 1
        },
        opacity: 0
    });
})();

// ==================== COUNTER ANIMATION ====================
(function initCounters() {
    const counters = document.querySelectorAll('[data-count]');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));

        ScrollTrigger.create({
            trigger: counter,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.to(counter, {
                    textContent: target,
                    duration: 2,
                    ease: 'power2.out',
                    snap: { textContent: 1 },
                    onUpdate: function () {
                        counter.textContent = Math.floor(parseFloat(counter.textContent));
                    }
                });
            }
        });
    });
})();

// ==================== MOBILE MENU ====================
(function initMobileMenu() {
    const btn = document.getElementById('menuBtn');
    const menu = document.getElementById('mobileMenu');

    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        menu.classList.toggle('active');
        document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    menu.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            btn.classList.remove('active');
            menu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
})();

// ==================== SMOOTH SCROLL FOR NAV LINKS ====================
(function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
})();

// ==================== STAGGERED CARD ANIMATIONS ====================
(function initCardAnimations() {
    // Project cards stagger
    gsap.utils.toArray('.project-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                once: true
            },
            y: 60,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.1,
            ease: 'power3.out'
        });
    });

    // Timeline items stagger
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                once: true
            },
            x: -40,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.08,
            ease: 'power3.out'
        });
    });

    // What I Do cards stagger
    gsap.utils.toArray('.whatido-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                once: true
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'power3.out'
        });
    });

    // Tech logo items stagger
    gsap.utils.toArray('.tech-logo-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: '.techstack-logo-grid',
                start: 'top 85%',
                once: true
            },
            y: 20,
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            delay: i * 0.04,
            ease: 'back.out(1.5)'
        });
    });

    // Lifecycle pipeline animation
    const lifecycleDiagram = document.querySelector('.lifecycle-diagram');
    if (lifecycleDiagram) {
        const steps = lifecycleDiagram.querySelectorAll('.lifecycle-step');
        const connectors = lifecycleDiagram.querySelectorAll('.lifecycle-connector');
        const merge = lifecycleDiagram.querySelector('.lifecycle-merge');

        ScrollTrigger.create({
            trigger: lifecycleDiagram,
            start: 'top 75%',
            once: true,
            onEnter: () => {
                const tl = gsap.timeline();
                // Animate steps sequentially
                steps.forEach((step, i) => {
                    tl.to(step, {
                        opacity: 1,
                        y: 0,
                        duration: 0.4,
                        ease: 'power2.out',
                        onComplete: () => step.classList.add('active')
                    }, i * 0.18);
                });
                // Animate connectors
                connectors.forEach((conn, i) => {
                    tl.to(conn, {
                        duration: 0.01,
                        onComplete: () => conn.classList.add('active')
                    }, (i + 1) * 0.18 - 0.05);
                });
                // Merge glow at end
                if (merge) {
                    tl.to(merge, {
                        duration: 0.01,
                        onComplete: () => merge.classList.add('active')
                    }, steps.length * 0.18 + 0.2);
                }
            }
        });
    }

    // Education cards
    gsap.utils.toArray('.education-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                once: true
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'power3.out'
        });
    });

    // Stat cards
    gsap.utils.toArray('.stat-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                once: true
            },
            scale: 0.8,
            opacity: 0,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'back.out(1.5)'
        });
    });

    // Achievement items
    gsap.utils.toArray('.achievement-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                once: true
            },
            y: 30,
            opacity: 0,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'power3.out'
        });
    });
})();

// ==================== MARQUEE SPEED ON SCROLL ====================
(function initMarqueeScroll() {
    const marquee = document.querySelector('.marquee-track');
    if (!marquee) return;

    let speed = 1;

    ScrollTrigger.create({
        trigger: '.techstack',
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
            const velocity = Math.abs(self.getVelocity());
            speed = Math.min(velocity / 200, 5);
            marquee.style.animationDuration = Math.max(30 / (1 + speed * 0.5), 5) + 's';
        }
    });
})();

// ==================== PROJECT CARD TILT ====================
(function initCardTilt() {
    if (window.innerWidth <= 768) return;

    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            gsap.to(card, {
                rotateX: y * -5,
                rotateY: x * 5,
                transformPerspective: 1000,
                duration: 0.4,
                ease: 'power2.out'
            });

            // Move the background glow to follow cursor
            const bg = card.querySelector('.project-card-bg');
            if (bg) {
                bg.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(108, 99, 255, 0.12) 0%, transparent 60%)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.7,
                ease: 'elastic.out(1, 0.5)'
            });
        });
    });
})();

// ==================== TEXT REVEAL ON SCROLL (for section titles) ====================
(function initTextReveal() {
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                once: true
            },
            clipPath: 'inset(0 100% 0 0)',
            duration: 1,
            ease: 'power4.inOut'
        });
    });
})();

// ==================== CONTACT SECTION SPECIAL ANIMATION ====================
(function initContactAnimation() {
    gsap.from('.contact-title', {
        scrollTrigger: {
            trigger: '.contact',
            start: 'top 70%',
            once: true
        },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });

    gsap.from('.contact-info-card', {
        scrollTrigger: {
            trigger: '.contact',
            start: 'top 70%',
            once: true
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: 'power3.out'
    });
})();

// ==================== CONTACT TYPING EFFECT ====================
(function initContactTyping() {
    const phrases = [
        'something great',
        'the next big thing',
        'an AI pipeline',
        'a killer MVP',
        'something scalable',
        'your next platform'
    ];
    const el = document.getElementById('contactTyping');
    if (!el) return;

    let phraseIdx = 0, charIdx = 0, deleting = false, started = false;

    function type() {
        const word = phrases[phraseIdx];
        if (deleting) {
            el.textContent = word.substring(0, charIdx - 1);
            charIdx--;
        } else {
            el.textContent = word.substring(0, charIdx + 1);
            charIdx++;
        }

        let speed = deleting ? 35 : 70;

        if (!deleting && charIdx === word.length) {
            speed = 2000;
            deleting = true;
        } else if (deleting && charIdx === 0) {
            deleting = false;
            phraseIdx = (phraseIdx + 1) % phrases.length;
            speed = 400;
        }
        setTimeout(type, speed);
    }

    // Start only when scrolled into view
    ScrollTrigger.create({
        trigger: '.contact',
        start: 'top 75%',
        once: true,
        onEnter: () => {
            if (!started) {
                started = true;
                el.textContent = '';
                type();
            }
        }
    });
})();

// ==================== ABOUT TEXT SPLIT ANIMATION ====================
(function initAboutAnimation() {
    gsap.utils.toArray('.about-text p').forEach((p, i) => {
        gsap.from(p, {
            scrollTrigger: {
                trigger: p,
                start: 'top 85%',
                once: true
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'power3.out'
        });
    });
})();

// ==================== ACTIVE NAV LINK HIGHLIGHT ====================
(function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveLink() {
        const scrollPos = window.scrollY + 200;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveLink);
})();

// ==================== PERFORMANCE: REDUCE PARTICLES ON LOW FPS ====================
(function initPerformanceMonitor() {
    let frames = 0;
    let lastTime = performance.now();

    function checkFPS() {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            const fps = frames;
            frames = 0;
            lastTime = now;

            // If FPS drops below 30, reduce particle effects
            if (fps < 30) {
                const canvas = document.getElementById('particleCanvas');
                if (canvas) canvas.style.opacity = '0.3';
            }
        }
        requestAnimationFrame(checkFPS);
    }
    requestAnimationFrame(checkFPS);
})();

console.log('%c✦ Maruf Ahmed Portfolio ✦', 'color: #6c63ff; font-size: 16px; font-weight: bold;');
console.log('%cBuilt with passion 🚀', 'color: #8b8b96; font-size: 12px;');
