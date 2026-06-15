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

        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = max - min || 1;
        const step = w / (points.length - 1);

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
                const trend = svg.dataset.trend || 'up';
                drawSparkline(svg, points, trend);
            } catch (e) { /* ignore parse errors */ }
        });
    }

    /* ===========================================================
       3. CANVAS CHARTS
       =========================================================== */

    /* ---- Shared drawing helpers ---- */
    function clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function setCanvasSize(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.getContext('2d').scale(dpr, dpr);
    }

    /* ---- Line chart ---- */
    function drawLineChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        setCanvasSize(canvas);
        const ctx = canvas.getContext('2d');
        const W = canvas.getBoundingClientRect().width;
        const H = canvas.getBoundingClientRect().height;

        const pad = { top: 10, right: 10, bottom: 24, left: 36 };
        const cW = W - pad.left - pad.right;
        const cH = H - pad.top - pad.bottom;

        const labels = data.labels;
        const values = data.values;
        const min = Math.min(...values) * 0.9;
        const max = Math.max(...values) * 1.05;
        const range = max - min || 1;
        const step = cW / (labels.length - 1);
        const color = data.color || '#3b82f6';

        function xPos(i) { return pad.left + i * step; }
        function yPos(v) { return pad.top + cH - ((v - min) / range) * cH; }

        clearCanvas(ctx, canvas);

        /* Grid lines + Y labels */
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const ticks = 4;
        for (let t = 0; t <= ticks; t++) {
            const y = pad.top + (cH / ticks) * t;
            const val = max - (range / ticks) * t;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + cW, y);
            ctx.stroke();
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(val.toFixed(0), pad.left - 4, y + 3);
        }

        /* X labels */
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px system-ui, sans-serif';
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
        grad.addColorStop(0, color + '30');
        grad.addColorStop(1, color + '05');
        ctx.fillStyle = grad;
        ctx.fill();

        /* Line */
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(values[0]));
        values.forEach(function (v, i) { if (i > 0) ctx.lineTo(xPos(i), yPos(v)); });
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        /* Dots */
        values.forEach(function (v, i) {
            ctx.beginPath();
            ctx.arc(xPos(i), yPos(v), 3, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    /* ---- Bar chart ---- */
    function drawBarChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        setCanvasSize(canvas);
        const ctx = canvas.getContext('2d');
        const W = canvas.getBoundingClientRect().width;
        const H = canvas.getBoundingClientRect().height;

        const pad = { top: 10, right: 10, bottom: 24, left: 36 };
        const cW = W - pad.left - pad.right;
        const cH = H - pad.top - pad.bottom;
        const max = Math.max(...data.values) * 1.1;
        const n = data.values.length;
        const gap = 4;
        const barW = (cW - gap * (n - 1)) / n;
        const color = data.color || '#3b82f6';
        const hlColor = data.hlColor || '#10b981';

        clearCanvas(ctx, canvas);

        /* Grid */
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const ticks = 4;
        for (let t = 0; t <= ticks; t++) {
            const y = pad.top + (cH / ticks) * t;
            const val = max - (max / ticks) * t;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + cW, y);
            ctx.stroke();
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(val.toFixed(0), pad.left - 4, y + 3);
        }

        /* Bars */
        data.values.forEach(function (v, i) {
            const x = pad.left + i * (barW + gap);
            const bH = (v / max) * cH;
            const y = pad.top + cH - bH;
            const c = (i === n - 1) ? hlColor : color;

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
                ctx.font = '9px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(data.labels[i], x + barW / 2, H - pad.bottom + 13);
            }
        });
    }

    /* ---- Chart data from DB (injected by PHP as window.CPDO_CHARTS) ---- */
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
       4. LEAFLET GIS MAP - San Fernando City, La Union
       =========================================================== */
    function initMap() {
        if (typeof L === 'undefined') return;

        const map = L.map('clupMap', {
                    center: [16.60, 120.315],
                    zoom: 13,
                    zoomControl: true,
                });

        // Add CartoDB Positron base map (clean, light)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        }).addTo(map);

        const barangays = window.CPDO_BARANGAYS || [];

        // Create name -> data lookup
        const barangayLookup = {};
        barangays.forEach(function (b) {
            barangayLookup[b.name.toLowerCase()] = b;
        });

        // Status colors
        const STATUS_COLOR = {
            high:            { fill: '#16a34a', border: '#15803d' },
            moderate:        { fill: '#ca8a04', border: '#a16207' },
            needs_attention: { fill: '#dc2626', border: '#b91c1c' },
        };

        // Load GeoJSON barangay boundaries
        fetch('../../data/sf-barangays.geojson')
            .then(function (response) { return response.json(); })
            .then(function (geoData) {
                // Add status to each feature
                geoData.features.forEach(function (feature) {
                    const name = feature.properties.name.toLowerCase();
                    const barangayData = barangayLookup[name];
                    if (barangayData) {
                        feature.properties.status = barangayData.performance_status || 'moderate';
                        feature.properties.data = barangayData;
                    } else {
                        feature.properties.status = 'moderate';
                    }
                });

                // Helper function to get style based on layer
                function getLayerStyle(feature, layerType) {
                    let status = 'moderate';
                    
                    if (feature.properties.data) {
                        const data = feature.properties.data;
                        
                        switch(layerType) {
                            case 'poverty':
                                if (data.poverty_level === 'low') {
                                    status = 'high';
                                } else if (data.poverty_level === 'high') {
                                    status = 'needs_attention';
                                } else {
                                    status = 'moderate';
                                }
                                break;
                            case 'program':
                                if (data.active_programs > 3) {
                                    status = 'high';
                                } else if (data.active_programs < 1) {
                                    status = 'needs_attention';
                                } else {
                                    status = 'moderate';
                                }
                                break;
                            default: // economic
                                status = feature.properties.status || 'moderate';
                        }
                    }

                    const colors = STATUS_COLOR[status] || STATUS_COLOR.moderate;
                    return {
                        fillColor: colors.fill,
                        weight: 2,
                        opacity: 1,
                        color: colors.border,
                        fillOpacity: 0.7
                    };
                }

                // Add layer to map
                const barangayLayer = L.geoJSON(geoData, {
                    style: function (feature) {
                        const layerSelect = document.getElementById('layerSelect');
                        const layerType = layerSelect ? layerSelect.value : 'economic';
                        return getLayerStyle(feature, layerType);
                    },
                    onEachFeature: function (feature, layer) {
                        const name = feature.properties.name;
                        const data = feature.properties.data;

                        // Show barangay name as permanent label
                        layer.bindTooltip('<div style="font-size:10px;font-weight:bold;text-align:center;white-space:nowrap;">' + name + '</div>', {
                            permanent: true,
                            direction: 'center',
                            opacity: 0.9
                        });

                        // Popup with barangay info
                        let popupContent = '<div style="font-weight:700;font-size:14px;color:#1f2937;">' + name + '</div>';
                        if (data) {
                            if (data.zone) {
                                popupContent += '<div style="font-size:12px;">Zone: ' + data.zone + '</div>';
                            }
                            popupContent += '<div style="font-size:12px;">Population: ' + (data.population ? data.population.toLocaleString() : 'N/A') + '</div>';
                            if (data.area_sqkm) {
                                popupContent += '<div style="font-size:12px;">Area: ' + parseFloat(data.area_sqkm).toFixed(2) + ' sq km</div>';
                            }
                            if (data.performance_status) {
                                popupContent += '<div style="margin-top:4px;font-weight:600;color:' + STATUS_COLOR[data.performance_status].border + ';">Performance: ' + data.performance_status.replace('_', ' ') + '</div>';
                            }
                            if (data.poverty_level) {
                                popupContent += '<div style="font-size:12px;">Poverty Level: ' + data.poverty_level + '</div>';
                            }
                            if (typeof data.active_programs !== 'undefined') {
                                popupContent += '<div style="font-size:12px;">Active Programs: ' + data.active_programs + '</div>';
                            }
                        }
                        layer.bindPopup(popupContent);

                        // Hover effect
                        layer.on('mouseover', function (e) {
                            const layer = e.target;
                            layer.setStyle({
                                weight: 3,
                                fillOpacity: 0.85
                            });
                            layer.bringToFront();
                        });
                        layer.on('mouseout', function (e) {
                            barangayLayer.resetStyle(e.target);
                        });
                    }
                }).addTo(map);

                // Fit to barangay bounds
                if (barangayLayer.getBounds().isValid()) {
                    map.fitBounds(barangayLayer.getBounds(), { padding: [20, 20] });
                }

                // Add legend to map
                const legend = L.control({ position: 'bottomright' });
                legend.onAdd = function () {
                    const div = L.DomUtil.create('div', 'leaflet-control map-legend');
                    div.innerHTML = '<div class="legend-title">Development Performance</div>' +
                        '<div class="legend-row"><span class="legend-box" style="background:#16a34a;"></span> High</div>' +
                        '<div class="legend-row"><span class="legend-box" style="background:#ca8a04;"></span> Moderate</div>' +
                        '<div class="legend-row"><span class="legend-box" style="background:#dc2626;"></span> Needs Attention</div>';
                    return div;
                };
                legend.addTo(map);

                // Barangay selector
                const barangaySelect = document.getElementById('barangaySelect');
                if (barangaySelect) {
                    barangaySelect.addEventListener('change', function () {
                        const selected = this.value.toLowerCase();
                        if (selected === 'all') {
                            if (barangayLayer.getBounds().isValid()) {
                                map.fitBounds(barangayLayer.getBounds(), { padding: [20, 20] });
                            }
                            return;
                        }
                        barangayLayer.eachLayer(function (layer) {
                            if (layer.feature && layer.feature.properties.name.toLowerCase() === selected) {
                                map.fitBounds(layer.getBounds(), { padding: [40, 40] });
                                layer.openPopup();
                            }
                        });
                    });
                }

                // Layer selector
                const layerSelect = document.getElementById('layerSelect');
                if (layerSelect) {
                    layerSelect.addEventListener('change', function () {
                        if (!barangayLayer) return;

                        barangayLayer.eachLayer(function (layer) {
                            if (layer.feature) {
                                layer.setStyle(getLayerStyle(layer.feature, this.value));
                            }
                        }.bind(this));
                    });
                }
            })
            .catch(function (error) {
                console.error('Error loading barangay boundaries:', error);
            });
    }

    /* ===========================================================
       5. PROGRAM TABLE — client-side search + pagination
       =========================================================== */
    function initProgramTable() {
        const searchInput = document.getElementById('progSearch');
        const statusSel = document.getElementById('progStatus');
        const pagination = document.getElementById('progPagination');

        if (!pagination) return;

        const totalPages = parseInt(pagination.dataset.pages, 10) || 1;
        const curPage = parseInt(pagination.dataset.current, 10) || 1;

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
            const end = Math.min(total, cur + 2);
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
            if (statusSel) params.set('status', statusSel.value);
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
                    t.classList.remove('sorted-asc', 'sorted-desc');
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

}());
