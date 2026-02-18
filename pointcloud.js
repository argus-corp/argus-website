/* ================================================================
   ARGUS — 3D Point Cloud Visualizer  v3
   Three.js WebGL — depth-coloured garment with all measurement paths
   ================================================================ */

(function () {
    'use strict';

    var DATA_URL = 'data/pointcloud.json';

    /* ---- Measurement palette ---- */
    var MEAS_HEX = {
        'bottom':          '#00E5A0',
        'chest':           '#00B4D8',
        'length':          '#FFD166',
        'shoulder-left':   '#FF6B6B',
        'shoulder-right':  '#FF6B6B',
        'sleeve-left':     '#C77DFF',
        'sleeve-right':    '#C77DFF',
    };
    function measColor(name) { return new THREE.Color(MEAS_HEX[name] || '#00E5A0'); }
    function measHex(name)   { return MEAS_HEX[name] || '#00E5A0'; }

    /* Z exaggeration for visual depth */
    var Z_EX  = 3.0;
    var Z_OFF = 0.0;   // no offset — paths sit on surface

    /* ---- State ---- */
    var scene, camera, renderer, cloud, measGroup, kpGroup;
    var autoRotate = true;
    var measLines  = [];
    var allMeasurements = [];
    var clock;
    var canvas, wrap;
    var zSpanMm = 100;

    /* Spherical orbit */
    var sph    = { theta: 0.4, phi: 1.15, radius: 3.0 };
    var tgtSph = { theta: 0.4, phi: 1.15, radius: 3.0 };
    var isDragging = false;
    var prev = { x: 0, y: 0 };

    /* ============================================================
       INIT
       ============================================================ */
    function init() {
        canvas = document.getElementById('pointCloudCanvas');
        wrap   = document.getElementById('visualizerWrap');
        if (!canvas || !wrap) return;

        clock = new THREE.Clock();
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(
            45, wrap.clientWidth / wrap.clientHeight, 0.01, 100
        );
        applyCam();

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(wrap.clientWidth, wrap.clientHeight);
        renderer.setClearColor(0x000000, 0);

        measGroup = new THREE.Group();
        kpGroup   = new THREE.Group();
        scene.add(measGroup);
        scene.add(kpGroup);

        loadData();
        setupInteraction();
        setupControls();
        window.addEventListener('resize', onResize);
        tick();
    }

    function applyCam() {
        var r = sph.radius;
        camera.position.set(
            r * Math.sin(sph.phi) * Math.sin(sph.theta),
            r * Math.cos(sph.phi),
            r * Math.sin(sph.phi) * Math.cos(sph.theta)
        );
        camera.lookAt(0, 0, 0);
    }

    /* ============================================================
       LOAD DATA
       ============================================================ */
    function loadData() {
        fetch(DATA_URL)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                allMeasurements = data.measurements || [];
                zSpanMm = data.zSpanMm || 100;

                buildCloud(data);
                buildKeypoints(data);
                buildMeasurements(data);
                populateHUD(data.measurements);

                var overlay = document.getElementById('vizOverlay');
                if (overlay) overlay.classList.add('hidden');

                setTimeout(function () {
                    var hud = document.getElementById('vizHud');
                    if (hud) hud.classList.add('visible');
                }, 400);

                // Start the simultaneous path animation after a short delay
                setTimeout(function () {
                    animateAllPaths();
                }, 1000);
            })
            .catch(function (err) {
                console.error('Point cloud load failed:', err);
            });
    }

    /* ============================================================
       BUILD POINT CLOUD — spectrum depth coloring, random point sizes
       ============================================================ */
    function buildCloud(data) {
        var N = data.pointCount;
        var pos    = new Float32Array(N * 3);
        var colors = new Float32Array(N * 3);
        var sizes  = new Float32Array(N);

        // Collect Z values for depth mapping
        var zMin = Infinity, zMax = -Infinity;
        for (var i = 0; i < N; i++) {
            var zRaw = data.points[i * 3 + 2];
            if (zRaw < zMin) zMin = zRaw;
            if (zRaw > zMax) zMax = zRaw;
        }
        var zRange = zMax - zMin || 0.001;

        // Simple seeded PRNG to avoid Math.random() being too uniform
        var seed = 12345;
        function rand() {
            seed = (seed * 16807 + 0) % 2147483647;
            return (seed & 0x7fffffff) / 2147483647;
        }

        for (var i = 0; i < N; i++) {
            var x =  data.points[i * 3];
            var y = -data.points[i * 3 + 1];
            var z =  data.points[i * 3 + 2] * Z_EX;

            pos[i * 3]     = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;

            // Depth t: 0 (far/low Z) → 1 (close/high Z)
            var t = (data.points[i * 3 + 2] - zMin) / zRange;

            // Spectrum / heatmap coloring:
            // deep blue → cyan → green → yellow → red
            var r, g, b;
            if (t < 0.25) {
                var s = t / 0.25;
                r = 0.05;
                g = 0.05 + s * 0.55;
                b = 0.55 + s * 0.20;
            } else if (t < 0.5) {
                var s = (t - 0.25) / 0.25;
                r = 0.05 + s * 0.15;
                g = 0.60 + s * 0.30;
                b = 0.75 - s * 0.50;
            } else if (t < 0.75) {
                var s = (t - 0.5) / 0.25;
                r = 0.20 + s * 0.60;
                g = 0.90 - s * 0.05;
                b = 0.25 - s * 0.15;
            } else {
                var s = (t - 0.75) / 0.25;
                r = 0.80 + s * 0.15;
                g = 0.85 - s * 0.50;
                b = 0.10 - s * 0.05;
            }

            colors[i * 3]     = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;

            // Random point size to break grid patterns (0.6 → 2.0 range)
            sizes[i] = 0.6 + rand() * 1.4;
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));

        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uPR:       { value: Math.min(window.devicePixelRatio, 2) },
                uBaseSize: { value: 1.2 },
            },
            vertexShader: [
                'attribute vec3 aColor;',
                'attribute float aSize;',
                'varying vec3 vC;',
                'uniform float uPR;',
                'uniform float uBaseSize;',
                'void main() {',
                '  vC = aColor;',
                '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
                '  gl_PointSize = aSize * uBaseSize * uPR * (40.0 / -mv.z);',
                '  gl_PointSize = clamp(gl_PointSize, 0.5, 6.0);',
                '  gl_Position = projectionMatrix * mv;',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vC;',
                'void main() {',
                '  float d = length(gl_PointCoord - 0.5);',
                '  if (d > 0.5) discard;',
                '  float a = smoothstep(0.5, 0.08, d) * 0.15;',
                '  gl_FragColor = vec4(vC, a);',
                '}'
            ].join('\n'),
            transparent: true,
            depthTest: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
        });

        cloud = new THREE.Points(geo, mat);
        scene.add(cloud);
    }

    /* ============================================================
       KEYPOINTS — small glowing dots
       ============================================================ */
    function buildKeypoints(data) {
        if (!data.keypoints) return;

        var dotGeo = new THREE.SphereGeometry(0.006, 10, 10);

        data.keypoints.forEach(function (kp) {
            var p = new THREE.Vector3(kp.pos[0], -kp.pos[1], kp.pos[2] * Z_EX);

            var dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({
                color: 0xffffff, transparent: true, opacity: 0.5,
            }));
            dot.position.copy(p);
            kpGroup.add(dot);
        });
    }

    /* ============================================================
       MEASUREMENT LINES
       ============================================================ */
    function buildMeasurements(data) {
        if (!data.paths) return;

        data.paths.forEach(function (pObj) {
            if (!pObj.path3d || pObj.path3d.length < 2) return;

            var col = measColor(pObj.name);
            var verts = pObj.path3d.map(function (p) {
                return new THREE.Vector3(p[0], -p[1], p[2] * Z_EX);
            });

            // Thick tube with shader-based progressive reveal via uProgress
            var curve = new THREE.CatmullRomCurve3(verts, false, 'centripetal', 0.3);
            var tubeSeg = Math.min(verts.length * 2, 300);
            var tubeGeo = new THREE.TubeGeometry(curve, tubeSeg, 0.006, 8, false);

            // Compute per-vertex "t" parameter (0→1 along curve) for progressive reveal
            var tubePositions = tubeGeo.getAttribute('position');
            var vertCount = tubePositions.count;
            var tAttr = new Float32Array(vertCount);
            var radialSeg = 8; // must match TubeGeometry radialSegments
            for (var vi = 0; vi < vertCount; vi++) {
                // TubeGeometry lays out (tubeSeg+1) rings of (radialSeg+1) verts
                var ring = Math.floor(vi / (radialSeg + 1));
                tAttr[vi] = ring / tubeSeg;
            }
            tubeGeo.setAttribute('aT', new THREE.BufferAttribute(tAttr, 1));

            var colVec = col;
            var tubeMat = new THREE.ShaderMaterial({
                uniforms: {
                    uColor:    { value: colVec },
                    uOpacity:  { value: 0.0 },
                    uProgress: { value: 0.0 },
                },
                vertexShader: [
                    'attribute float aT;',
                    'varying float vT;',
                    'void main() {',
                    '  vT = aT;',
                    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                    '}'
                ].join('\n'),
                fragmentShader: [
                    'uniform vec3 uColor;',
                    'uniform float uOpacity;',
                    'uniform float uProgress;',
                    'varying float vT;',
                    'void main() {',
                    '  if (vT > uProgress) discard;',
                    '  gl_FragColor = vec4(uColor, uOpacity);',
                    '}'
                ].join('\n'),
                transparent: true,
                depthTest: true,
                side: THREE.DoubleSide,
            });
            var tube = new THREE.Mesh(tubeGeo, tubeMat);

            // Keep thin line for fallback (hidden)
            var lineGeo = new THREE.BufferGeometry().setFromPoints(verts);
            var lineMat = new THREE.LineBasicMaterial({
                color: col, transparent: true, opacity: 0, linewidth: 1,
            });
            var line = new THREE.Line(lineGeo, lineMat);
            lineGeo.setDrawRange(0, 0);

            var dotGeo = new THREE.SphereGeometry(0.01, 10, 10);
            var startDot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({
                color: col, transparent: true, opacity: 0,
            }));
            startDot.position.copy(verts[0]);

            var endDot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({
                color: col, transparent: true, opacity: 0,
            }));
            endDot.position.copy(verts[verts.length - 1]);

            measGroup.add(tube);
            measGroup.add(line);
            measGroup.add(startDot);
            measGroup.add(endDot);

            var measCm = 0;
            for (var j = 0; j < allMeasurements.length; j++) {
                if (allMeasurements[j].name === pObj.name) {
                    measCm = allMeasurements[j].measured_cm;
                    break;
                }
            }

            var midIdx = Math.floor(verts.length / 2);

            measLines.push({
                name: pObj.name,
                tube: tube,
                line: line,
                startDot: startDot,
                endDot: endDot,
                total: verts.length,
                color: col,
                measCm: measCm,
                midPoint: verts[midIdx].clone(),
            });
        });
    }

    /* Helper: set measurement opacity (tube shader + line) */
    function setMeasOpacity(m, op) {
        m.tube.material.uniforms.uOpacity.value = op;
        m.line.material.opacity = op;
    }

    /* Helper: set tube progress (0→1, how much of the path is drawn) */
    function setMeasProgress(m, prog) {
        m.tube.material.uniforms.uProgress.value = prog;
        m.line.geometry.setDrawRange(0, Math.floor(prog * m.total));
    }

    /* ============================================================
       ANIMATE ALL PATHS SIMULTANEOUSLY
       Cloud loads → keypoints → all paths draw at once with counters
       ============================================================ */
    function animateAllPaths() {
        if (measLines.length === 0) return;

        var duration = 1800;
        var t0 = performance.now();

        // Reset all to beginning state
        measLines.forEach(function (m) {
            m.startDot.material.opacity = 1;
            m.endDot.material.opacity = 0;
            setMeasOpacity(m, 0.9);
            setMeasProgress(m, 0);    // start from 0 — nothing drawn yet
        });

        var rows = document.querySelectorAll('.viz-measurement-row');

        function step(ts) {
            var elapsed = ts - t0;
            var p = Math.min(elapsed / duration, 1);
            var e = 1 - Math.pow(1 - p, 3);  // ease-out cubic

            measLines.forEach(function (m, i) {
                // Progressively reveal tube + line from start to end
                setMeasProgress(m, e);

                // Animate counter in HUD
                if (rows[i]) {
                    var valEl = rows[i].querySelector('.viz-measurement-value');
                    if (valEl) {
                        valEl.innerHTML = (m.measCm * e).toFixed(1) + '<span class="unit">cm</span>';
                    }
                }
            });

            updateAllFloatingLabels(e);

            if (p < 1) {
                requestAnimationFrame(step);
            } else {
                // Finalize
                measLines.forEach(function (m, i) {
                    m.endDot.material.opacity = 1;
                    setMeasProgress(m, 1);
                    if (rows[i]) {
                        var valEl = rows[i].querySelector('.viz-measurement-value');
                        if (valEl) valEl.innerHTML = m.measCm.toFixed(1) + '<span class="unit">cm</span>';
                    }
                });
                updateAllFloatingLabels(1);
                setTimeout(startHighlightCycle, 2000);
            }
        }
        requestAnimationFrame(step);
    }

    /* ============================================================
       FLOATING LABELS — one per measurement, track 3D midpoints
       ============================================================ */
    var floatingLabels = [];

    function createFloatingLabels() {
        measLines.forEach(function (m) {
            var el = document.createElement('div');
            el.className = 'viz-floating-label';
            el.style.cssText =
                'position:absolute;pointer-events:none;z-index:12;' +
                'font-family:"JetBrains Mono",monospace;font-size:11px;font-weight:600;' +
                'padding:3px 8px;border-radius:5px;' +
                'background:rgba(5,5,7,0.8);backdrop-filter:blur(6px);' +
                'border:1px solid ' + measHex(m.name) + '33;' +
                'white-space:nowrap;opacity:0;transition:opacity 0.3s;' +
                'transform:translate(-50%,-100%) translateY(-10px);';
            wrap.appendChild(el);
            floatingLabels.push({ el: el, meas: m });
        });
    }

    function updateAllFloatingLabels(progress) {
        if (floatingLabels.length === 0) createFloatingLabels();

        floatingLabels.forEach(function (fl) {
            var m = fl.meas;
            var el = fl.el;
            var hex = measHex(m.name);
            var val = (m.measCm * progress).toFixed(1);

            el.innerHTML =
                '<span style="color:' + hex + '">' + m.name + '</span>' +
                ' <span style="color:#e8e8ec">' + val +
                '<span style="color:#55555e;font-size:10px">cm</span></span>';

            var pos = m.midPoint.clone();
            pos.project(camera);

            if (pos.z > 1) { el.style.opacity = '0'; return; }

            var hw = wrap.clientWidth / 2;
            var hh = wrap.clientHeight / 2;
            el.style.left = (pos.x * hw + hw) + 'px';
            el.style.top  = (-pos.y * hh + hh) + 'px';
            el.style.opacity = (m.tube.material.uniforms.uOpacity.value > 0) ? '0.9' : '0';
        });
    }

    /* ============================================================
       HIGHLIGHT CYCLE — after animation, cycle emphasis through each
       (all paths stay visible, one gets full brightness)
       ============================================================ */
    var cycleIdx = 0;
    var cycleTimer = null;
    var cycleRunning = false;

    function startHighlightCycle() {
        cycleRunning = true;
        cycleIdx = 0;
        doHighlight();
    }

    function stopHighlightCycle() {
        cycleRunning = false;
        if (cycleTimer) clearTimeout(cycleTimer);
    }

    function doHighlight() {
        if (!cycleRunning) return;
        if (measLines.length === 0) return;

        var rows = document.querySelectorAll('.viz-measurement-row');

        measLines.forEach(function (m, i) {
            var active = (i === cycleIdx);
            setMeasOpacity(m, active ? 1.0 : 0.25);
            setMeasProgress(m, 1);  // keep fully drawn
            m.startDot.material.opacity = active ? 1 : 0.2;
            m.endDot.material.opacity = active ? 1 : 0.2;
            if (rows[i]) rows[i].classList.toggle('selected', active);
        });

        floatingLabels.forEach(function (fl, i) {
            fl.el.style.opacity = (i === cycleIdx) ? '1' : '0.3';
        });

        cycleTimer = setTimeout(function () {
            cycleIdx = (cycleIdx + 1) % measLines.length;
            doHighlight();
        }, 2500);
    }

    /* ============================================================
       HUD — clickable measurement rows
       ============================================================ */
    function populateHUD(measurements) {
        var el = document.getElementById('vizMeasurements');
        if (!el || !measurements) return;

        measurements.forEach(function (m, i) {
            var hex = measHex(m.name);

            var row = document.createElement('div');
            row.className = 'viz-measurement-row';
            row.setAttribute('data-idx', i);
            row.style.cursor = 'pointer';
            row.innerHTML =
                '<span class="viz-measurement-name" style="color:' + hex + '">' +
                    '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + hex + ';margin-right:6px;vertical-align:middle;"></span>' +
                    m.name +
                '</span>' +
                '<span class="viz-measurement-value">0.0<span class="unit">cm</span></span>';
            el.appendChild(row);

            row.addEventListener('click', function () {
                var idx = parseInt(row.getAttribute('data-idx'));
                var rows = document.querySelectorAll('.viz-measurement-row');

                if (rows[idx] && rows[idx].classList.contains('selected') && !cycleRunning) {
                    // Deselect → show all, restart cycle
                    measLines.forEach(function (m2) {
                        setMeasOpacity(m2, 0.9);
                        m2.startDot.material.opacity = 1;
                        m2.endDot.material.opacity = 1;
                    });
                    rows.forEach(function (r) { r.classList.remove('selected'); });
                    floatingLabels.forEach(function (fl) { fl.el.style.opacity = '0.9'; });
                    startHighlightCycle();
                } else {
                    // Isolate this measurement
                    stopHighlightCycle();
                    measLines.forEach(function (m2, j) {
                        var active = (j === idx);
                        setMeasOpacity(m2, active ? 1.0 : 0.12);
                        m2.startDot.material.opacity = active ? 1 : 0.1;
                        m2.endDot.material.opacity = active ? 1 : 0.1;
                    });
                    rows.forEach(function (r, j) { r.classList.toggle('selected', j === idx); });
                    floatingLabels.forEach(function (fl, j) {
                        fl.el.style.opacity = (j === idx) ? '1' : '0.15';
                    });
                }
            });

            setTimeout(function () { row.classList.add('visible'); }, 500 + i * 100);
        });
    }

    /* ============================================================
       INTERACTION — drag orbit, scroll zoom
       ============================================================ */
    function setupInteraction() {
        wrap.addEventListener('mousedown', function (e) {
            isDragging = true;
            prev.x = e.clientX; prev.y = e.clientY;
            autoRotate = false;
            var btn = document.getElementById('vizAutoRotate');
            if (btn) btn.classList.remove('active');
        });
        window.addEventListener('mouseup', function () { isDragging = false; });
        window.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            tgtSph.theta += (e.clientX - prev.x) * 0.006;
            tgtSph.phi   -= (e.clientY - prev.y) * 0.006;
            tgtSph.phi = Math.max(0.25, Math.min(Math.PI - 0.25, tgtSph.phi));
            prev.x = e.clientX; prev.y = e.clientY;
        });

        wrap.addEventListener('touchstart', function (e) {
            if (e.touches.length === 1) {
                isDragging = true;
                prev.x = e.touches[0].clientX; prev.y = e.touches[0].clientY;
                autoRotate = false;
            }
        }, { passive: true });
        wrap.addEventListener('touchmove', function (e) {
            if (!isDragging || e.touches.length !== 1) return;
            tgtSph.theta += (e.touches[0].clientX - prev.x) * 0.006;
            tgtSph.phi   -= (e.touches[0].clientY - prev.y) * 0.006;
            tgtSph.phi = Math.max(0.25, Math.min(Math.PI - 0.25, tgtSph.phi));
            prev.x = e.touches[0].clientX; prev.y = e.touches[0].clientY;
        }, { passive: true });
        wrap.addEventListener('touchend', function () { isDragging = false; }, { passive: true });

        wrap.addEventListener('wheel', function (e) {
            var newR = tgtSph.radius + e.deltaY * 0.003;
            newR = Math.max(1.5, Math.min(6, newR));

            // If already at max zoom-out and scrolling down, let page scroll
            if (e.deltaY > 0 && tgtSph.radius >= 5.95) {
                // Don't prevent default — page scrolls naturally
                return;
            }
            // If already at max zoom-in and scrolling up, let page scroll
            if (e.deltaY < 0 && tgtSph.radius <= 1.55) {
                return;
            }

            e.preventDefault();
            tgtSph.radius = newR;
        }, { passive: false });
    }

    /* ---- Controls ---- */
    function setupControls() {
        var autoBtn  = document.getElementById('vizAutoRotate');
        var resetBtn = document.getElementById('vizResetView');
        var playBtn  = document.getElementById('vizPlayMeasurements');

        if (autoBtn) autoBtn.addEventListener('click', function () {
            autoRotate = !autoRotate;
            autoBtn.classList.toggle('active', autoRotate);
        });
        if (resetBtn) resetBtn.addEventListener('click', function () {
            tgtSph.theta = 0.4; tgtSph.phi = 1.15; tgtSph.radius = 3.0;
            autoRotate = true;
            if (autoBtn) autoBtn.classList.add('active');
        });
        if (playBtn) playBtn.addEventListener('click', function () {
            if (cycleRunning) {
                stopHighlightCycle();
                measLines.forEach(function (m) {
                    setMeasOpacity(m, 0.9);
                    m.startDot.material.opacity = 1;
                    m.endDot.material.opacity = 1;
                });
                document.querySelectorAll('.viz-measurement-row').forEach(function (r) {
                    r.classList.remove('selected');
                });
                floatingLabels.forEach(function (fl) { fl.el.style.opacity = '0.9'; });
                playBtn.classList.remove('active');
            } else {
                measLines.forEach(function (m) {
                    setMeasProgress(m, 0);
                    setMeasOpacity(m, 0);
                    m.startDot.material.opacity = 0;
                    m.endDot.material.opacity = 0;
                });
                floatingLabels.forEach(function (fl) { fl.el.style.opacity = '0'; });
                animateAllPaths();
                playBtn.classList.add('active');
            }
        });
    }

    /* ---- Resize ---- */
    function onResize() {
        if (!wrap || !camera || !renderer) return;
        var w = wrap.clientWidth, h = wrap.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        if (cloud) cloud.material.uniforms.uPR.value = Math.min(window.devicePixelRatio, 2);
    }

    /* ============================================================
       RENDER LOOP
       ============================================================ */
    function tick() {
        requestAnimationFrame(tick);

        if (autoRotate) tgtSph.theta += 0.003;

        sph.theta  += (tgtSph.theta  - sph.theta)  * 0.07;
        sph.phi    += (tgtSph.phi    - sph.phi)     * 0.07;
        sph.radius += (tgtSph.radius - sph.radius)  * 0.07;

        applyCam();

        // Keep floating labels tracking 3D positions
        if (floatingLabels.length > 0) {
            floatingLabels.forEach(function (fl) {
                var pos = fl.meas.midPoint.clone();
                pos.project(camera);
                if (pos.z > 1) { fl.el.style.visibility = 'hidden'; return; }
                fl.el.style.visibility = 'visible';
                var hw = wrap.clientWidth / 2;
                var hh = wrap.clientHeight / 2;
                fl.el.style.left = (pos.x * hw + hw) + 'px';
                fl.el.style.top  = (-pos.y * hh + hh) + 'px';
            });
        }

        renderer.render(scene, camera);
    }

    /* ---- Bootstrap ---- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
