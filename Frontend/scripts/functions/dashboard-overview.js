/* ============================================================
   DASHBOARD OVERVIEW — Charts, GIS Map, Table, Sparklines
   ============================================================ */
(function () {
    'use strict';

    /* ===========================================================
       1. SPARKLINES (KPI cards)
    =========================================================== */
    function drawSparkline(svgEl, points, trend) {
        if (!svgEl) return;
        const w = svgEl.clientWidth || 100;
        const h = 32;
        svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

        const min   = Math.min(...points);
        const max   = Math.max(...points);
        const range = max - min || 1;
        const step  = w / (points.length - 1);

        const coords = points.map((v, i) => [
            i * step,
            h - ((v - min) / range) * (h - 4) - 2
        ]);

        // Fill area
        const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pts = coords.map(c => c[0] + ',' + c[1]).join(' L ');
        fillPath.setAttribute('d', 'M ' + pts + ' L ' + coords[coords.length - 1][0] + ',' + h + ' L 0,' + h + ' Z');
        fillPath.setAttribute('fill', trend === 'up' ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)');
        svgEl.appendChild(fillPath);

        // Line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        line.setAttribute('points', coords.map(c => c.join(',')).join(' '));
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', trend === 'up' ? '#10b981' : '#ef4444');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-linejoin', 'round');
        line.setAttribute('stroke-linecap', 'round');
        svgEl.appendChild(line);
    }

    function initSparklines() {
        document.querySelectorAll('.kpi-spark').forEach(function (svg) {
            try {
                const points = JSON.parse(svg.dataset.points || '[]');
                const trend  = svg.dataset.trend || 'up';
                drawSparkline(svg, points, trend);
            } catch (e) { /* ignore parse errors */ }
        });
    }

    /* ===========================================================
       3. CANVAS CHARTS
    =========================================================== */

    /* --- Shared drawing helpers --- */
    function clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function setCanvasSize(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width  = rect.width  * dpr;
        canvas.height = rect.height * dpr;
        canvas.getContext('2d').scale(dpr, dpr);
    }

    /* --- Line chart --- */
    function drawLineChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        setCanvasSize(canvas);
        const ctx = canvas.getContext('2d');
        const W   = canvas.getBoundingClientRect().width;
        const H   = canvas.getBoundingClientRect().height;

        const pad  = { top: 10, right: 10, bottom: 24, left: 36 };
        const cW   = W - pad.left - pad.right;
        const cH   = H - pad.top  - pad.bottom;

        const labels = data.labels;
        const values = data.values;
        const min    = Math.min(...values) * 0.9;
        const max    = Math.max(...values) * 1.05;
        const range  = max - min || 1;
        const step   = cW / (labels.length - 1);
        const color  = data.color || '#3b82f6';

        function xPos(i) { return pad.left + i * step; }
        function yPos(v) { return pad.top + cH - ((v - min) / range) * cH; }

        clearCanvas(ctx, canvas);

        /* Grid lines + Y labels */
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth   = 1;
        const ticks = 4;
        for (let t = 0; t <= ticks; t++) {
            const y    = pad.top + (cH / ticks) * t;
            const val  = max - (range / ticks) * t;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + cW, y);
            ctx.stroke();
            ctx.fillStyle  = '#94a3b8';
            ctx.font       = '10px system-ui, sans-serif';
            ctx.textAlign  = 'right';
            ctx.fillText(val.toFixed(0), pad.left - 4, y + 3);
        }

        /* X labels */
        ctx.fillStyle = '#94a3b8';
        ctx.font      = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        labels.forEach(function (lbl, i) {
            if (i % Math.ceil(labels.length / 7) === 0 || i === labels.length - 1) {
                ctx.fillText(lbl, xPos(i), H - pad.bottom + 14);
            }
        });

        /* Fill area under line */
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(values[0]));
        values.forEach(function (v, i) { ctx.lineTo(xPos(i), yPos(v)); });
        ctx.lineTo(xPos(values.length - 1), pad.top + cH);
        ctx.lineTo(xPos(0), pad.top + cH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
        grad.addColorStop(0,   color + '30');
        grad.addColorStop(1,   color + '05');
        ctx.fillStyle = grad;
        ctx.fill();

        /* Line */
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(values[0]));
        values.forEach(function (v, i) { if (i > 0) ctx.lineTo(xPos(i), yPos(v)); });
        ctx.strokeStyle = color;
        ctx.lineWidth   = 2;
        ctx.lineJoin    = 'round';
        ctx.lineCap     = 'round';
        ctx.stroke();

        /* Dots */
        values.forEach(function (v, i) {
            ctx.beginPath();
            ctx.arc(xPos(i), yPos(v), 3, 0, Math.PI * 2);
            ctx.fillStyle   = '#fff';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth   = 2;
            ctx.stroke();
        });
    }

    /* --- Bar chart --- */
    function drawBarChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        setCanvasSize(canvas);
        const ctx = canvas.getContext('2d');
        const W   = canvas.getBoundingClientRect().width;
        const H   = canvas.getBoundingClientRect().height;

        const pad   = { top: 10, right: 10, bottom: 24, left: 36 };
        const cW    = W - pad.left - pad.right;
        const cH    = H - pad.top  - pad.bottom;
        const max   = Math.max(...data.values) * 1.1;
        const n     = data.values.length;
        const gap   = 4;
        const barW  = (cW - gap * (n - 1)) / n;
        const color = data.color || '#3b82f6';
        const hlColor = data.hlColor || '#10b981';

        clearCanvas(ctx, canvas);

        /* Grid */
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth   = 1;
        const ticks = 4;
        for (let t = 0; t <= ticks; t++) {
            const y   = pad.top + (cH / ticks) * t;
            const val = max - (max / ticks) * t;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + cW, y);
            ctx.stroke();
            ctx.fillStyle = '#94a3b8';
            ctx.font      = '10px system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(val.toFixed(0), pad.left - 4, y + 3);
        }

        /* Bars */
        data.values.forEach(function (v, i) {
            const x  = pad.left + i * (barW + gap);
            const bH = (v / max) * cH;
            const y  = pad.top + cH - bH;
            const c  = (i === n - 1) ? hlColor : color;

            /* Rounded top bar */
            const r = Math.min(3, barW / 2, bH / 2);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + barW - r, y);
            ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
            ctx.lineTo(x + barW, y + bH);
            ctx.lineTo(x, y + bH);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fillStyle = c;
            ctx.fill();

            /* X label */
            if (data.labels && data.labels[i]) {
                ctx.fillStyle = '#94a3b8';
                ctx.font      = '9px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(data.labels[i], x + barW / 2, H - pad.bottom + 13);
            }
        });
    }

    /* --- Chart data from DB (injected by PHP as window.CPDO_CHARTS) --- */
    function initCharts() {
        const C = window.CPDO_CHARTS || {};

        drawLineChart('chartBusiness', C.business || {
            labels: ['Jan', 'Feb'], values: [0, 0], color: '#3b82f6'
        });

        drawBarChart('chartInvestment', C.investment || {
            labels: ['Jan', 'Feb'], values: [0, 0], color: '#93c5fd', hlColor: '#1d4ed8'
        });

        drawLineChart('chartEmployment', C.employment || {
            labels: ['Jan', 'Feb'], values: [0, 0], color: '#10b981'
        });

        drawBarChart('chartAgri', C.agri || {
            labels: ['Jan', 'Feb'], values: [0, 0], color: '#6ee7b7', hlColor: '#059669'
        });
    }

    /* ===========================================================
       4. LEAFLET GIS MAP — San Fernando City, La Union
    =========================================================== */
    function initMap() {
        if (typeof L === 'undefined') return;

        const map = L.map('clupMap', {
            center:  [16.6159, 120.3176],
            zoom:    13,
            zoomControl: true,
        });

        /* OSM tile layer */
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        /* ---- Barangay markers from DB (window.CPDO_BARANGAYS) ---- */
        const barangays = window.CPDO_BARANGAYS || [];

        const STATUS_COLOR = {
            high:             { fill:'#16a34a', border:'#15803d' },
            moderate:         { fill:'#ca8a04', border:'#a16207' },
            needs_attention:  { fill:'#dc2626', border:'#b91c1c' },
        };

        const statusLabel = {
            high:            'High',
            moderate:        'Moderate',
            needs_attention: 'Needs Attention',
        };

        const markers = [];

        barangays.forEach(function (b) {
            const lat = parseFloat(b.lat);
            const lng = parseFloat(b.lng);
            if (!lat || !lng) return;

            const c     = STATUS_COLOR[b.status] || STATUS_COLOR['moderate'];
            const label = statusLabel[b.status]  || b.status;
            const badgeColor = c.fill;

            const circle = L.circleMarker([lat, lng], {
                radius:      9,
                color:       c.border,
                weight:      1.5,
                fillColor:   c.fill,
                fillOpacity: 0.75,
            }).addTo(map);

            circle.bindPopup(
                '<div class="popup-title"><i class="fas fa-map-marker-alt" style="color:' + badgeColor + '"></i> ' + b.name + '</div>' +
                '<div class="popup-row"><span class="popup-label">Status:</span> <span style="color:' + badgeColor + ';font-weight:600">' + label + '</span></div>' +
                '<div class="popup-row"><span class="popup-label">Population:</span> ' + (parseInt(b.population) || 'N/A').toLocaleString() + '</div>' +
                '<div class="popup-row"><span class="popup-label">Poverty Level:</span> ' + (b.poverty_level || 'N/A') + '</div>'
            );

            circle.bindTooltip(
                '<strong>' + b.name + '</strong><br>' + label,
                { sticky: true, className: 'leaflet-tooltip-custom', opacity: 0.9 }
            );

            circle.on('mouseover', function () { circle.setStyle({ fillOpacity: 1, weight: 2.5 }); });
            circle.on('mouseout',  function () { circle.setStyle({ fillOpacity: 0.75, weight: 1.5 }); });
            circle.on('click',     function (e) { circle.openPopup(e.latlng); });

            markers.push({ name: b.name, circle: circle });
        });

        /* Fit map to marker bounds if we have any */
        if (markers.length) {
            const group = L.featureGroup(markers.map(m => m.circle));
            if (group.getBounds().isValid()) {
                map.fitBounds(group.getBounds(), { padding: [30, 30] });
            }
        }

        /* ---- Barangay selector ---- */
        const barangaySelect = document.getElementById('barangaySelect');
        if (barangaySelect) {
            barangaySelect.addEventListener('change', function () {
                if (this.value === 'all') {
                    const g = L.featureGroup(markers.map(m => m.circle));
                    if (g.getBounds().isValid()) map.fitBounds(g.getBounds(), { padding: [20, 20] });
                    return;
                }
                const val = this.value.toLowerCase();
                markers.forEach(function (m) {
                    if (m.name.toLowerCase().includes(val)) {
                        map.setView(m.circle.getLatLng(), 15);
                        m.circle.openPopup();
                    }
                });
            });
        }

        /* ---- Layer switcher (visual opacity change) ---- */
        const layerSelect = document.getElementById('layerSelect');
        if (layerSelect) {
            layerSelect.addEventListener('change', function () {
                const opacity = this.value === 'poverty' ? 0.9
                              : this.value === 'program'  ? 0.5 : 0.75;
                markers.forEach(function (m) {
                    m.circle.setStyle({ fillOpacity: opacity });
                });
            });
        }

        /* Expose map for other scripts */
        window.cpdo_map = map;
    }

    /* ===========================================================
       5. PROGRAM TABLE — client-side search + pagination
    =========================================================== */
    function initProgramTable() {
        const searchInput = document.getElementById('progSearch');
        const statusSel   = document.getElementById('progStatus');
        const pagination  = document.getElementById('progPagination');

        if (!pagination) return;

        const totalPages = parseInt(pagination.dataset.pages, 10)  || 1;
        const curPage    = parseInt(pagination.dataset.current, 10) || 1;

        /* Build pagination buttons */
        function buildPagination(cur, total) {
            pagination.innerHTML = '';

            function makeBtn(label, page, disabled, active) {
                const btn = document.createElement('button');
                btn.className = 'page-btn' + (active ? ' active' : '');
                btn.textContent = label;
                btn.disabled = disabled;
                btn.addEventListener('click', function () { navigatePage(page); });
                return btn;
            }

            pagination.appendChild(makeBtn('‹', cur - 1, cur === 1, false));

            const start = Math.max(1, cur - 2);
            const end   = Math.min(total, cur + 2);
            for (let p = start; p <= end; p++) {
                pagination.appendChild(makeBtn(p, p, false, p === cur));
            }

            pagination.appendChild(makeBtn('›', cur + 1, cur === total, false));
        }

        buildPagination(curPage, totalPages);

        function navigatePage(page) {
            const params = new URLSearchParams(window.location.search);
            params.set('page', page);
            if (searchInput) params.set('search', searchInput.value);
            if (statusSel)   params.set('status', statusSel.value);
            window.location.search = params.toString();
        }

        /* Debounced search */
        let searchTimer;
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(function () { navigatePage(1); }, 400);
            });
        }
        if (statusSel) {
            statusSel.addEventListener('change', function () { navigatePage(1); });
        }

        /* Column sort (visual only — real sort via server) */
        document.querySelectorAll('#programsTable th[data-col]').forEach(function (th) {
            th.addEventListener('click', function () {
                const icon = th.querySelector('.sort-icon');
                const wasSorted = th.classList.contains('sorted-asc') || th.classList.contains('sorted-desc');
                document.querySelectorAll('#programsTable th').forEach(function (t) {
                    t.classList.remove('sorted-asc','sorted-desc');
                });
                if (!wasSorted || th.classList.contains('sorted-desc')) {
                    th.classList.add('sorted-asc');
                    if (icon) icon.className = 'fas fa-sort-up sort-icon';
                } else {
                    th.classList.add('sorted-desc');
                    if (icon) icon.className = 'fas fa-sort-down sort-icon';
                }
            });
        });
    }

    /* ===========================================================
       6. BOOT — Run after DOM is ready
    =========================================================== */
    function boot() {
        initSparklines();
        initCharts();
        initMap();
        initProgramTable();

        /* Redraw charts on window resize (debounced) */
        let resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                initSparklines();
                initCharts();
            }, 200);
        });
    }

    /* Real-time refresh: reload page every 30 seconds for updated data */
    function refreshDashboard() {
        window.location.reload();
    }
    setInterval(refreshDashboard, 30000);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

}());
