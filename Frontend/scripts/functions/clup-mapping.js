/* ============================================================
   CLUP MAP — San Fernando City, La Union
   Fetches REAL barangay boundary polygons from OpenStreetMap
   Uses database performance status for coloring
   ============================================================ */
(function () {
    'use strict';

    /* ============================================================
       1. CONSTANTS
       ============================================================ */
    const PERFORMANCE_COLORS = {
        high:           { fill:'#10B981', opacity:.65, border:'#059669', label:'High', short:'High' },
        moderate:       { fill:'#F59E0B', opacity:.60, border:'#D97706', label:'Moderate', short:'Moderate' },
        needs_attention: { fill:'#EF4444', opacity:.60, border:'#DC2626', label:'Needs Attention', short:'At Risk' },
    };

    /* San Fernando City, La Union bounding box [S,W,N,E] */
    const BBOX = '16.552,120.283,16.658,120.448';

    /* Overpass API endpoint */
    const OVERPASS = 'https://overpass-api.de/api/interpreter';

    /* Get barangay data from database */
    const DB_BARANGAYS = window.CPDO_CLUP_BARANGAYS || [];
    const DB_BARANGAYS_MAP = {};
    DB_BARANGAYS.forEach(b => {
        DB_BARANGAYS_MAP[b.name.toLowerCase()] = b;
    });

    /* ============================================================
       2. GET PERFORMANCE STATUS
       ============================================================ */
    function getPerformanceStatus(name) {
        const key = name.toLowerCase().replace(/[^a-z0-9 \-]/g,'').trim();
        const dbBarangay = DB_BARANGAYS_MAP[key];
        if (dbBarangay && dbBarangay.performance_status) {
            return dbBarangay.performance_status;
        }
        return 'moderate';
    }

    function getExtra(name) {
        const key = name.toLowerCase().replace(/[^a-z0-9 \-]/g,'').trim();
        const dbBarangay = DB_BARANGAYS_MAP[key];
        if (dbBarangay) {
            return {
                area: parseFloat(dbBarangay.area_sqkm) * 100, // Convert sq km to hectares
                pop: parseInt(dbBarangay.population),
                district: dbBarangay.zone,
                poverty_level: dbBarangay.poverty_level,
                performance_status: dbBarangay.performance_status
            };
        }
        return { area: 0, pop: 0, district: 'San Fernando City' };
    }

    /* ============================================================
       3. OSM → GEOJSON CONVERTER
       ============================================================ */
    function osmToGeoJSON(osmData) {
        /* Index nodes */
        const nodeMap = new Map();
        osmData.elements.filter(e => e.type === 'node')
            .forEach(e => nodeMap.set(e.id, [e.lon, e.lat]));

        /* Index ways */
        const wayMap = new Map();
        osmData.elements.filter(e => e.type === 'way').forEach(e => {
            const pts = (e.nodes || []).map(id => nodeMap.get(id)).filter(Boolean);
            if (pts.length) wayMap.set(e.id, pts);
        });

        const features = [];

        osmData.elements.filter(e => e.type === 'relation').forEach(rel => {
            const tags = rel.tags || {};
            const name = tags.name || tags['name:en'] || '';
            if (!name) return;

            /* Collect outer way coordinate arrays */
            const outerWays = (rel.members || [])
                .filter(m => m.type === 'way' && (m.role === 'outer' || m.role === ''))
                .map(m => wayMap.get(m.ref))
                .filter(w => w && w.length > 1);

            if (!outerWays.length) return;

            const ring = joinWays(outerWays);
            if (!ring || ring.length < 4) return;

            /* Close ring */
            const f = ring[0], l = ring[ring.length - 1];
            if (f[0] !== l[0] || f[1] !== l[1]) ring.push([f[0], f[1]]);

            const status = getPerformanceStatus(name);
            const extra = getExtra(name);

            features.push({
                type: 'Feature',
                properties: { name, status, area: extra.area, population: extra.pop, district: extra.district, poverty_level: extra.poverty_level },
                geometry: { type: 'Polygon', coordinates: [ring] },
            });
        });

        return { type: 'FeatureCollection', features };
    }

    function joinWays(wayList) {
        if (wayList.length === 1) return [...wayList[0]];
        const result = [...wayList[0]];
        const pool   = wayList.slice(1).map(w => [...w]);
        const EPS    = 1e-5;

        while (pool.length) {
            const last = result[result.length - 1];
            let ok = false;
            for (let i = 0; i < pool.length; i++) {
                const w = pool[i];
                const f = w[0], l = w[w.length - 1];
                if (Math.abs(last[0]-f[0]) < EPS && Math.abs(last[1]-f[1]) < EPS) {
                    result.push(...w.slice(1));
                    pool.splice(i,1);
                    ok=true;
                    break;
                }
                if (Math.abs(last[0]-l[0]) < EPS && Math.abs(last[1]-l[1]) < EPS) {
                    result.push(...[...w].reverse().slice(1));
                    pool.splice(i,1);
                    ok=true;
                    break;
                }
            }
            if (!ok) break;
        }
        return result;
    }

    /* ============================================================
       4. MAP INIT
       ============================================================ */
    const map = L.map('clupFullMap', {
        center: [16.6120, 120.3380],
        zoom: 13,
        zoomControl: false,
    });

    const TILES = {
        streets:   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap contributors', maxZoom:19 }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution:'© Esri', maxZoom:19 }),
        topo:      L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution:'© OpenTopoMap', maxZoom:17 }),
    };
    TILES.streets.addTo(map);
    let currentTile = 'streets';

    /* ============================================================
       5. LOAD BARANGAY DATA
       ============================================================ */
    function setLoader(visible, msg) {
        const el = document.getElementById('mapLoader');
        if (!el) return;
        el.style.display = visible ? 'flex' : 'none';
        if (msg) {
            const m = el.querySelector('.loader-msg');
            if (m) m.textContent = msg;
        }
    }

    function setError(msg) {
        const el = document.getElementById('mapError');
        if (!el) return;
        el.style.display = msg ? 'flex' : 'none';
        if (msg) {
            const m = el.querySelector('.error-msg');
            if (m) m.textContent = msg;
        }
    }

    async function loadBoundaries() {
        setLoader(true, 'Fetching barangay boundaries from OpenStreetMap…');
        setError('');

        /* Overpass query — admin_level=6 = barangay in PH */
        const q = `[out:json][timeout:90];
        (
            relation["boundary"="administrative"]["admin_level"="6"](${BBOX});
        );
        out body;
        >;
        out skel qt;`;

        try {
            const res = await fetch(OVERPASS + '?data=' + encodeURIComponent(q));
            if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
            const raw = await res.json();

            if (!raw.elements || !raw.elements.length) throw new Error('No data returned');

            const geojson = osmToGeoJSON(raw);

            if (!geojson.features.length) throw new Error('No barangay boundaries found in OSM data');

            setLoader(false);
            buildLayer(geojson);

        } catch (err) {
            console.warn('Overpass failed:', err.message, '— using fallback data');
            setLoader(true, 'OSM request failed — loading approximate data…');
            setTimeout(() => {
                setLoader(false);
                buildLayer(buildFallbackGeoJSON());
            }, 800);
        }
    }

    /* ============================================================
       6. GEO LAYER
       ============================================================ */
    let geoLayer     = null;
    let activeFilter = 'all';
    let selectedLyr  = null;
    let allFeatures  = [];
    let nameLabels   = [];

    function styleFor(feature) {
        const c   = PERFORMANCE_COLORS[feature.properties.status] || PERFORMANCE_COLORS.moderate;
        const dim = activeFilter !== 'all' && feature.properties.status !== activeFilter;
        return {
            color:       dim ? '#ccc'  : c.border,
            weight:      dim ? 0.5     : 1.8,
            fillColor:   dim ? '#e5e5e5' : c.fill,
            fillOpacity: dim ? 0.12    : c.opacity,
        };
    }

    function buildLayer(geojson) {
        if (geoLayer) {
            map.removeLayer(geoLayer);
            geoLayer = null;
        }
        nameLabels.forEach(label => map.removeLayer(label));
        nameLabels = [];
        allFeatures = geojson.features;

        geoLayer = L.geoJSON(geojson, {
            style: styleFor,
            onEachFeature(feat, layer) {
                const p = feat.properties;
                layer.on({
                    mouseover(e) {
                        const c = PERFORMANCE_COLORS[p.status];
                        layer.setStyle({ weight:3, fillOpacity:0.85, color: c.border });
                        layer.bringToFront();
                        showTip(e, p);
                    },
                    mouseout() {
                        geoLayer.resetStyle(layer);
                        hideTip();
                    },
                    click() {
                        selectBgy(layer, p);
                    },
                });

                /* Add barangay name label */
                const centroid = layer.getBounds().getCenter();
                const nameLabel = L.marker(centroid, {
                    icon: L.divIcon({
                        className: 'barangay-label',
                        html: `<div class="barangay-name-label">${p.name}</div>`,
                        iconSize: [120, 40],
                        iconAnchor: [60, 20],
                    }),
                    interactive: false
                });
                nameLabels.push(nameLabel);
                nameLabel.addTo(map);
            },
        }).addTo(map);

        if (geoLayer.getBounds().isValid()) {
            map.fitBounds(geoLayer.getBounds(), { padding:[20,20] });
        }

        refreshCounts();
        rebuildList(allFeatures, 'all');
    }

    /* ============================================================
       7. TOOLTIP
       ============================================================ */
    const tipEl = document.getElementById('clupTooltip');

    function showTip(e, p) {
        if (!tipEl) return;
        const c = PERFORMANCE_COLORS[p.status];
        tipEl.innerHTML =
            `<div class="tooltip-name">${p.name}</div>` +
            `<div class="tooltip-row"><span class="tooltip-label">Status:</span>${c ? c.short : p.status}</div>` +
            `<div class="tooltip-row"><span class="tooltip-label">Land Area:</span>${p.area ? p.area.toFixed(1)+' ha' : 'N/A'}</div>` +
            `<div class="tooltip-row"><span class="tooltip-label">Population:</span>${p.population ? p.population.toLocaleString() : 'N/A'}</div>` +
            `<div class="tooltip-row"><span class="tooltip-label">Poverty:</span>${p.poverty_level ? p.poverty_level : 'N/A'}</div>`;
        tipEl.classList.add('visible');
        moveTip(e.originalEvent);
    }

    function moveTip(ev) {
        if (!tipEl || !tipEl.classList.contains('visible')) return;
        const rect = document.getElementById('clupFullMap').getBoundingClientRect();
        let x = ev.clientX - rect.left + 16;
        let y = ev.clientY - rect.top - 10;
        if (x + 220 > rect.width) {
            x = ev.clientX - rect.left - 250;
        }
        if (y + 160 > rect.height) {
            y = ev.clientY - rect.top - 170;
        }
        tipEl.style.left = x + 'px';
        tipEl.style.top  = y + 'px';
    }

    function hideTip() {
        tipEl && tipEl.classList.remove('visible');
    }

    document.getElementById('clupFullMap').addEventListener('mousemove', e => moveTip(e));

    /* ============================================================
       8. SELECT BARANGAY — popup + info panel
       ============================================================ */
    function selectBgy(layer, p) {
        if (selectedLyr) geoLayer.resetStyle(selectedLyr);
        selectedLyr = layer;

        const c = PERFORMANCE_COLORS[p.status];
        layer.setStyle({ weight:3, fillOpacity:0.88, color: c.border });

        const popHtml =
            `<div class="popup-wrap">
                <div class="popup-head">
                    <span class="popup-bgy-name">${p.name}</span>
                    <span class="popup-badge ${p.status}">${c.short}</span>
                </div>
                <div class="popup-grid">
                    <div class="popup-stat"><div class="popup-stat-val">${p.area ? p.area.toFixed(1) : '—'}</div><div class="popup-stat-lbl">Area (ha)</div></div>
                    <div class="popup-stat"><div class="popup-stat-val">${p.population ? p.population.toLocaleString() : '—'}</div><div class="popup-stat-lbl">Population</div></div>
                </div>
                <button class="popup-detail-btn" onclick="window._clupDetail(${JSON.stringify(p).replace(/"/g,'&quot;')})">View Full Details</button>
            </div>`;

        layer.bindPopup(popHtml, { maxWidth:240, minWidth:200 }).openPopup();
        showInfoPanel(p);
        activateTab('info');
        highlightListItem(p.name);
        updateStatus(p);
    }

    window._clupDetail = function(p) {
        showInfoPanel(p);
        activateTab('info');
        openSidebar();
    };

    /* ============================================================
       9. SIDEBAR TABS
       ============================================================ */
    function activateTab(id) {
        document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
        document.querySelectorAll('.sidebar-tab-content').forEach(c => c.classList.toggle('active', c.dataset.content === id));
    }

    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab.dataset.tab));
    });

    /* ============================================================
       10. INFO PANEL
       ============================================================ */
    function showInfoPanel(p) {
        document.getElementById('infoPlaceholder').style.display = 'none';
        const panel = document.getElementById('infoPanelContent');
        panel.classList.add('visible');
        const c = PERFORMANCE_COLORS[p.status];
        panel.innerHTML =
            `<div class="info-header">
                <div class="info-bgy-name">${p.name}</div>
                <span class="info-classification ${p.status}"><i class="fas fa-chart-line"></i> ${c.label}</span>
            </div>
            <div class="info-stats">
                <div class="info-stat"><div class="info-stat-val">${p.area ? p.area.toFixed(1) : '—'}</div><div class="info-stat-lbl">Land Area (ha)</div></div>
                <div class="info-stat"><div class="info-stat-val">${p.population ? p.population.toLocaleString() : '—'}</div><div class="info-stat-lbl">Population</div></div>
                <div class="info-stat"><div class="info-stat-val">${(p.area && p.population) ? (p.population/p.area).toFixed(1) : '—'}</div><div class="info-stat-lbl">Density (p/ha)</div></div>
                <div class="info-stat"><div class="info-stat-val">${p.district || '—'}</div><div class="info-stat-lbl">Zone</div></div>
            </div>
            <div class="info-details">
                <div class="info-detail-row"><span class="info-detail-lbl">Barangay</span><span class="info-detail-val">${p.name}</span></div>
                <div class="info-detail-row"><span class="info-detail-lbl">City</span><span class="info-detail-val">San Fernando City</span></div>
                <div class="info-detail-row"><span class="info-detail-lbl">Province</span><span class="info-detail-val">La Union</span></div>
                <div class="info-detail-row"><span class="info-detail-lbl">Region</span><span class="info-detail-val">Ilocos Region (I)</span></div>
                <div class="info-detail-row"><span class="info-detail-lbl">Poverty</span><span class="info-detail-val">${p.poverty_level || 'N/A'}</span></div>
            </div>
            <button class="info-zoom-btn" id="zoomBtn"><i class="fas fa-crosshairs"></i> Zoom to Barangay</button>`;

        document.getElementById('zoomBtn').addEventListener('click', () => {
            if (selectedLyr) map.fitBounds(selectedLyr.getBounds(), { padding:[40,40] });
        });
    }

    /* ============================================================
       11. BARANGAY LIST
       ============================================================ */
    function rebuildList(features, filterCls) {
        const listEl = document.getElementById('bgyList');
        if (!listEl) return;
        listEl.innerHTML = '';

        const items = filterCls === 'all' ? features
            : features.filter(f => f.properties.status === filterCls);
        items.sort((a,b) => a.properties.name.localeCompare(b.properties.name));

        items.forEach(f => {
            const p = f.properties;
            const el = document.createElement('div');
            el.className = 'bgy-list-item';
            el.dataset.name = p.name;
            el.innerHTML =
                `<span class="bgy-dot ${p.status}"></span>
                 <div><div class="bgy-list-name">${p.name}</div></div>
                 <span class="bgy-list-area">${p.area ? p.area.toFixed(0)+' ha' : ''}</span>`;
            el.addEventListener('click', () => {
                if (!geoLayer) return;
                geoLayer.eachLayer(layer => {
                    if (layer.feature && layer.feature.properties.name === p.name) {
                        map.fitBounds(layer.getBounds(), { padding:[40,40] });
                        selectBgy(layer, p);
                    }
                });
            });
            listEl.appendChild(el);
        });
    }

    function highlightListItem(name) {
        document.querySelectorAll('.bgy-list-item').forEach(el => {
            el.classList.toggle('active', el.dataset.name === name);
        });
    }

    document.getElementById('bgyFilterSelect') && document.getElementById('bgyFilterSelect')
        .addEventListener('change', function() {
            rebuildList(allFeatures, this.value);
        });

    /* ============================================================
       12. LEGEND COUNTS
       ============================================================ */
    function refreshCounts() {
        ['high','moderate','needs_attention'].forEach(cls => {
            const el = document.getElementById('count-' + cls.replace('_','-'));
            if (el) el.textContent = allFeatures.filter(f => f.properties.status === cls).length;
        });
        const tot = document.getElementById('stat-total');
        if (tot) tot.textContent = allFeatures.length;
    }

    /* Legend item clicks */
    document.querySelectorAll('.legend-item[data-cls]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelector('.filter-pill[data-cls="' + item.dataset.cls + '"]') &&
            document.querySelector('.filter-pill[data-cls="' + item.dataset.cls + '"]').click();
        });
    });

    /* ============================================================
       13. FILTER PILLS
       ============================================================ */
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeFilter = pill.dataset.cls;
            if (geoLayer) geoLayer.setStyle(styleFor);
            rebuildList(allFeatures, activeFilter === 'all' ? 'all' : activeFilter);
            const sel = document.getElementById('bgyFilterSelect');
            if (sel) sel.value = activeFilter === 'all' ? 'all' : activeFilter;
        });
    });

    /* ============================================================
       14. SEARCH
       ============================================================ */
    const searchInput   = document.getElementById('clupSearch');
    const searchResults = document.getElementById('searchResults');

    searchInput && searchInput.addEventListener('input', function() {
        const q = this.value.trim().toLowerCase();
        if (!q || !allFeatures.length) {
            searchResults.classList.remove('open');
            return;
        }

        const hits = allFeatures
            .filter(f => f.properties.name.toLowerCase().includes(q))
            .slice(0, 8);

        if (!hits.length) {
            searchResults.classList.remove('open');
            return;
        }

        searchResults.innerHTML = hits.map(f => {
            const p = f.properties;
            const c = PERFORMANCE_COLORS[p.status];
            return `<div class="search-result-item" data-name="${p.name}">
                        <span class="search-result-dot ${p.status}"></span>
                        <span class="search-result-name">${p.name}</span>
                        <span class="search-result-type">${c ? c.short : p.status}</span>
                    </div>`;
        }).join('');
        searchResults.classList.add('open');

        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                searchInput.value = name;
                searchResults.classList.remove('open');
                geoLayer && geoLayer.eachLayer(layer => {
                    if (layer.feature && layer.feature.properties.name === name) {
                        map.fitBounds(layer.getBounds(), { padding:[50,50] });
                        selectBgy(layer, layer.feature.properties);
                    }
                });
            });
        });
    });

    document.addEventListener('click', e => {
        if (searchResults && !searchResults.contains(e.target) && e.target !== searchInput) {
            searchResults.classList.remove('open');
        }
    });

    /* ============================================================
       15. FLOATING CONTROLS
       ============================================================ */
    document.getElementById('ctrlZoomIn') && document.getElementById('ctrlZoomIn').addEventListener('click', () => map.zoomIn());
    document.getElementById('ctrlZoomOut') && document.getElementById('ctrlZoomOut').addEventListener('click', () => map.zoomOut());
    document.getElementById('ctrlReset') && document.getElementById('ctrlReset').addEventListener('click', () => {
        if (geoLayer && geoLayer.getBounds().isValid()) map.fitBounds(geoLayer.getBounds(), { padding:[16,16] });
        if (selectedLyr) {
            geoLayer.resetStyle(selectedLyr);
            selectedLyr = null;
        }
    });
    document.getElementById('ctrlFullscreen') && document.getElementById('ctrlFullscreen').addEventListener('click', () => {
        const el = document.documentElement;
        if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        else document.exitFullscreen && document.exitFullscreen();
    });
    document.getElementById('ctrlTile') && document.getElementById('ctrlTile').addEventListener('click', function() {
        const order = ['streets','satellite','topo'];
        const next  = order[(order.indexOf(currentTile) + 1) % order.length];
        map.removeLayer(TILES[currentTile]);
        TILES[next].addTo(map);
        currentTile = next;
        const names = { streets:'Streets', satellite:'Satellite', topo:'Topographic' };
        const nl = document.getElementById('layerName');
        if (nl) nl.textContent = names[next];
    });

    /* ============================================================
       16. SIDEBAR TOGGLE
       ============================================================ */
    const sidebarEl = document.getElementById('clupSidebar');
    let sidebarOpen = true;

    function openSidebar()  {
        sidebarEl && sidebarEl.classList.remove('collapsed');
        sidebarOpen = true;
    }
    function closeSidebar() {
        sidebarEl && sidebarEl.classList.add('collapsed');
        sidebarOpen = false;
    }

    ['sidebarToggleBtn','topbarSidebarBtn'].forEach(id => {
        document.getElementById(id) && document.getElementById(id).addEventListener('click', () => {
            sidebarOpen ? closeSidebar() : openSidebar();
        });
    });

    /* ============================================================
       17. STATUS BAR + COORDINATES
       ============================================================ */
    function updateStatus(p) {
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        if (p) {
            set('statusBarBgy',  p.name);
            set('statusBarArea', p.area ? p.area.toFixed(1)+' ha' : '—');
            set('statusBarCls',  PERFORMANCE_COLORS[p.status] ? PERFORMANCE_COLORS[p.status].short : p.status);
        } else {
            set('statusBarBgy',  '—');
            set('statusBarArea', '—');
            set('statusBarCls',  '—');
        }
    }

    map.on('mousemove', e => {
        const set = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v;
        };
        set('statusLat',  e.latlng.lat.toFixed(5) + '° N');
        set('statusLng',  e.latlng.lng.toFixed(5) + '° E');
    });
    map.on('zoomend', () => {
        const el = document.getElementById('statusZoom');
        if (el) el.textContent = 'Z' + map.getZoom();
    });

    /* ============================================================
       18. GEOJSON UPLOAD (fallback for users with own data)
       ============================================================ */
    document.getElementById('geojsonUpload') && document.getElementById('geojsonUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                /* Enrich properties */
                if (data.features) {
                    data.features.forEach(f => {
                        const p = f.properties;
                        if (p && p.name) {
                            p.status         = p.status || getPerformanceStatus(p.name);
                            const extra   = getExtra(p.name);
                            p.area        = p.area || extra.area;
                            p.population  = p.population || extra.pop;
                            p.district    = p.district || extra.district;
                        }
                    });
                }
                setError('');
                buildLayer(data);
            } catch (err) {
                alert('Invalid GeoJSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    });

    /* ============================================================
       19. FALLBACK DATA (simple irregular polygons)
       ============================================================ */
    function buildFallbackGeoJSON() {
        /* Approximate but irregular polygon data derived from actual San Fernando City geography */
        const data = [
            { n:'Poro',              s:'high',        pts:[[120.2848,16.6225],[120.2830,16.6120],[120.2845,16.6055],[120.2882,16.6012],[120.2935,16.6005],[120.2962,16.6035],[120.2952,16.6095],[120.2928,16.6152],[120.2888,16.6192],[120.2858,16.6222]] },
            { n:'Ilocanos Norte',    s:'high',        pts:[[120.2958,16.6218],[120.3045,16.6212],[120.3050,16.6175],[120.3005,16.6168],[120.2968,16.6172],[120.2958,16.6196]] },
            { n:'Ilocanos Sur',      s:'moderate',     pts:[[120.2958,16.6172],[120.2978,16.6170],[120.3005,16.6168],[120.3015,16.6148],[120.2985,16.6135],[120.2958,16.6148]] },
            { n:'Barangay I',        s:'moderate',      pts:[[120.3005,16.6212],[120.3045,16.6212],[120.3050,16.6188],[120.3020,16.6182],[120.3005,16.6190]] },
            { n:'Barangay II',       s:'moderate',      pts:[[120.3045,16.6212],[120.3080,16.6208],[120.3078,16.6188],[120.3055,16.6184],[120.3050,16.6188]] },
            { n:'Barangay III',      s:'moderate',      pts:[[120.3005,16.6182],[120.3050,16.6182],[120.3052,16.6162],[120.3022,16.6158],[120.3005,16.6165]] },
            { n:'Barangay IV',       s:'high',        pts:[[120.3050,16.6184],[120.3080,16.6180],[120.3078,16.6158],[120.3058,16.6155],[120.3052,16.6162]] },
            { n:'Pagdaraoan',        s:'high',        pts:[[120.2978,16.6170],[120.3050,16.6162],[120.3060,16.6135],[120.3042,16.6118],[120.3005,16.6118],[120.2978,16.6132]] },
            { n:'Cabaroan',          s:'high',        pts:[[120.3060,16.6212],[120.3155,16.6208],[120.3162,16.6178],[120.3145,16.6155],[120.3072,16.6152],[120.3060,16.6178]] },
            { n:'Catbangen',         s:'moderate',      pts:[[120.2958,16.6132],[120.3055,16.6118],[120.3065,16.6085],[120.3038,16.6062],[120.2975,16.6060],[120.2958,16.6082]] },
            { n:'San Agustin',       s:'high',        pts:[[120.2958,16.6060],[120.3035,16.6055],[120.3050,16.6020],[120.3022,16.5998],[120.2978,16.5992],[120.2958,16.6010]] },
            { n:'Madayegdeg',        s:'moderate',      pts:[[120.2958,16.5992],[120.3032,16.5982],[120.3048,16.5948],[120.3020,16.5930],[120.2978,16.5928],[120.2958,16.5950]] },
            { n:'Parian',            s:'high',        pts:[[120.3025,16.6062],[120.3098,16.6058],[120.3115,16.6028],[120.3090,16.6005],[120.3045,16.6002],[120.3025,16.6022]] },
            { n:'Lingsat',           s:'high',        pts:[[120.2940,16.6318],[120.3068,16.6308],[120.3082,16.6278],[120.3055,16.6248],[120.3010,16.6242],[120.2940,16.6252]] },
            { n:'Carlatan',          s:'high',        pts:[[120.2940,16.6252],[120.3010,16.6242],[120.3055,16.6248],[120.3068,16.6215],[120.3048,16.6210],[120.2958,16.6210],[120.2940,16.6225]] },
            { n:'Dalumpinas Oeste',  s:'needs_attention',  pts:[[120.2888,16.6462],[120.2998,16.6458],[120.3018,16.6415],[120.3010,16.6385],[120.2988,16.6368],[120.2908,16.6365],[120.2888,16.6390]] },
            { n:'Dalumpinas Este',   s:'moderate',      pts:[[120.3018,16.6458],[120.3128,16.6455],[120.3148,16.6420],[120.3125,16.6385],[120.3068,16.6378],[120.3018,16.6385],[120.3010,16.6415]] },
            { n:'Bangcusay',         s:'moderate',      pts:[[120.3128,16.6455],[120.3255,16.6450],[120.3272,16.6415],[120.3248,16.6380],[120.3148,16.6378],[120.3128,16.6415]] },
            { n:'Biday',             s:'needs_attention',  pts:[[120.3068,16.6378],[120.3182,16.6372],[120.3198,16.6342],[120.3175,16.6308],[120.3118,16.6305],[120.3072,16.6312],[120.3060,16.6338]] },
            { n:'Mameltac',          s:'moderate',      pts:[[120.3182,16.6385],[120.3308,16.6380],[120.3325,16.6348],[120.3302,16.6312],[120.3238,16.6308],[120.3182,16.6315],[120.3198,16.6342]] },
            { n:'Namtutan',          s:'moderate',      pts:[[120.3308,16.6380],[120.3428,16.6375],[120.3445,16.6342],[120.3422,16.6308],[120.3355,16.6302],[120.3302,16.6312],[120.3325,16.6348]] },
            { n:'Calabugao',         s:'moderate',      pts:[[120.3428,16.6380],[120.3555,16.6372],[120.3572,16.6338],[120.3548,16.6305],[120.3478,16.6298],[120.3422,16.6308],[120.3445,16.6342]] },
            { n:'Bato',              s:'needs_attention',  pts:[[120.3255,16.6450],[120.3388,16.6445],[120.3405,16.6408],[120.3382,16.6372],[120.3285,16.6368],[120.3248,16.6380],[120.3272,16.6415]] },
            { n:'Abut',              s:'moderate',      pts:[[120.3388,16.6445],[120.3548,16.6442],[120.3565,16.6402],[120.3542,16.6368],[120.3448,16.6362],[120.3405,16.6372],[120.3388,16.6408]] },
            { n:'Saoay',             s:'moderate',      pts:[[120.3428,16.6375],[120.3548,16.6368],[120.3565,16.6335],[120.3542,16.6302],[120.3472,16.6295],[120.3422,16.6308],[120.3445,16.6342]] },
            { n:'Puspus',            s:'moderate',      pts:[[120.3548,16.6408],[120.3712,16.6402],[120.3728,16.6365],[120.3705,16.6328],[120.3608,16.6322],[120.3548,16.6328],[120.3565,16.6368]] },
            { n:'Baraoas',           s:'moderate',      pts:[[120.3712,16.6402],[120.3898,16.6395],[120.3918,16.6358],[120.3895,16.6318],[120.3772,16.6312],[120.3712,16.6318],[120.3728,16.6358]] },
            { n:'Bangbangolan',      s:'high',        pts:[[120.3705,16.6378],[120.3895,16.6372],[120.3915,16.6335],[120.3892,16.6298],[120.3772,16.6292],[120.3705,16.6298],[120.3722,16.6338]] },
            { n:'Tanqui',            s:'moderate',      pts:[[120.3065,16.6248],[120.3168,16.6242],[120.3185,16.6210],[120.3162,16.6182],[120.3098,16.6175],[120.3062,16.6192],[120.3060,16.6218]] },
            { n:'Santiago Norte',    s:'moderate',      pts:[[120.3168,16.6242],[120.3285,16.6235],[120.3302,16.6205],[120.3278,16.6178],[120.3205,16.6172],[120.3162,16.6182],[120.3185,16.6210]] },
            { n:'Camansi',           s:'needs_attention',  pts:[[120.3285,16.6238],[120.3405,16.6232],[120.3422,16.6200],[120.3398,16.6172],[120.3322,16.6165],[120.3278,16.6178],[120.3302,16.6205]] },
            { n:'Dallangayan Oeste', s:'moderate',      pts:[[120.3162,16.6215],[120.3278,16.6208],[120.3295,16.6178],[120.3272,16.6150],[120.3195,16.6142],[120.3148,16.6152],[120.3145,16.6178]] },
            { n:'Dallangayan Este',  s:'moderate',      pts:[[120.3278,16.6210],[120.3398,16.6202],[120.3415,16.6172],[120.3392,16.6142],[120.3315,16.6135],[120.3272,16.6148],[120.3295,16.6178]] },
            { n:'Pias',              s:'high',        pts:[[120.3405,16.6232],[120.3558,16.6225],[120.3575,16.6190],[120.3552,16.6158],[120.3458,16.6150],[120.3398,16.6162],[120.3422,16.6195]] },
            { n:'Bacsil',            s:'moderate',      pts:[[120.3558,16.6225],[120.3748,16.6215],[120.3768,16.6175],[120.3745,16.6140],[120.3618,16.6132],[120.3558,16.6140],[120.3575,16.6175]] },
            { n:'Pacpaco',           s:'moderate',      pts:[[120.3748,16.6215],[120.3968,16.6205],[120.3988,16.6162],[120.3965,16.6122],[120.3818,16.6115],[120.3748,16.6122],[120.3768,16.6162]] },
            { n:'Santiago Sur',      s:'moderate',      pts:[[120.3072,16.6175],[120.3195,16.6168],[120.3215,16.6138],[120.3192,16.6110],[120.3118,16.6102],[120.3068,16.6115],[120.3062,16.6148]] },
            { n:'Sagayad',           s:'moderate',      pts:[[120.3112,16.6138],[120.3238,16.6130],[120.3258,16.6095],[120.3235,16.6062],[120.3155,16.6055],[120.3108,16.6068],[120.3108,16.6105]] },
            { n:'Langcuas',          s:'moderate',      pts:[[120.3238,16.6130],[120.3368,16.6122],[120.3388,16.6088],[120.3365,16.6055],[120.3282,16.6048],[120.3235,16.6062],[120.3258,16.6095]] },
            { n:'Cadaclan',          s:'high',        pts:[[120.3368,16.6122],[120.3528,16.6115],[120.3548,16.6080],[120.3525,16.6045],[120.3435,16.6038],[120.3368,16.6048],[120.3388,16.6082]] },
            { n:'Apaleng',           s:'high',        pts:[[120.3528,16.6115],[120.3715,16.6105],[120.3735,16.6068],[120.3712,16.6032],[120.3598,16.6025],[120.3528,16.6035],[120.3548,16.6072]] },
            { n:'Pao Norte',         s:'moderate',      pts:[[120.3715,16.6105],[120.3938,16.6092],[120.3958,16.6052],[120.3935,16.6015],[120.3798,16.6008],[120.3715,16.6018],[120.3735,16.6058]] },
            { n:'Nagyubuyuban',      s:'moderate',      pts:[[120.3938,16.6092],[120.4178,16.6078],[120.4195,16.6035],[120.4172,16.5995],[120.4018,16.5988],[120.3938,16.6000],[120.3958,16.6042]] },
            { n:'Sevilla',           s:'needs_attention',  pts:[[120.3098,16.6068],[120.3235,16.6058],[120.3255,16.6025],[120.3232,16.5992],[120.3152,16.5985],[120.3098,16.5998],[120.3095,16.6035]] },
            { n:'Narra Oeste',       s:'moderate',      pts:[[120.3098,16.6002],[120.3238,16.5995],[120.3258,16.5958],[120.3235,16.5925],[120.3155,16.5918],[120.3095,16.5930],[120.3092,16.5968]] },
            { n:'Narra Este',        s:'moderate',      pts:[[120.3238,16.5995],[120.3388,16.5985],[120.3408,16.5948],[120.3385,16.5912],[120.3298,16.5905],[120.3235,16.5918],[120.3258,16.5952]] },
            { n:'Birunget',          s:'moderate',      pts:[[120.3388,16.5985],[120.3548,16.5975],[120.3568,16.5935],[120.3545,16.5898],[120.3448,16.5892],[120.3385,16.5902],[120.3408,16.5942]] },
            { n:'Pao Sur',           s:'moderate',      pts:[[120.3548,16.5975],[120.3778,16.5962],[120.3798,16.5918],[120.3775,16.5878],[120.3622,16.5872],[120.3548,16.5882],[120.3568,16.5922]] },
            { n:'San Francisco',     s:'moderate',      pts:[[120.2958,16.5992],[120.3055,16.5982],[120.3072,16.5948],[120.3048,16.5918],[120.3002,16.5912],[120.2958,16.5922]] },
            { n:'San Vicente',       s:'high',        pts:[[120.2958,16.5922],[120.3052,16.5912],[120.3072,16.5875],[120.3048,16.5845],[120.3002,16.5838],[120.2958,16.5848]] },
            { n:'Canaoay',           s:'high',        pts:[[120.2888,16.5848],[120.3005,16.5838],[120.3022,16.5800],[120.3000,16.5768],[120.2938,16.5762],[120.2888,16.5772]] },
            { n:'Pagudpud',          s:'moderate',      pts:[[120.3002,16.5918],[120.3102,16.5908],[120.3122,16.5872],[120.3098,16.5838],[120.3048,16.5832],[120.3022,16.5848],[120.3000,16.5878]] },
            { n:'Bungro',            s:'needs_attention',  pts:[[120.3098,16.5942],[120.3248,16.5932],[120.3268,16.5892],[120.3245,16.5858],[120.3162,16.5852],[120.3098,16.5862],[120.3105,16.5900]] },
            { n:'Pagdalagan',        s:'moderate',      pts:[[120.3000,16.5800],[120.3125,16.5790],[120.3145,16.5752],[120.3122,16.5720],[120.3055,16.5712],[120.3000,16.5722],[120.2998,16.5762]] },
            { n:'Tanquigan',         s:'moderate',      pts:[[120.3125,16.5790],[120.3278,16.5778],[120.3298,16.5738],[120.3275,16.5702],[120.3188,16.5695],[120.3122,16.5705],[120.3145,16.5742]] },
            { n:'Siboan-Otong',      s:'moderate',      pts:[[120.3278,16.5778],[120.3455,16.5765],[120.3475,16.5722],[120.3452,16.5685],[120.3358,16.5678],[120.3295,16.5688],[120.3298,16.5728]] },
            { n:'Masicong',          s:'needs_attention',  pts:[[120.3455,16.5765],[120.3668,16.5750],[120.3688,16.5705],[120.3665,16.5665],[120.3548,16.5658],[120.3455,16.5668],[120.3475,16.5712]] },
            { n:'Cabarsican',        s:'moderate',      pts:[[120.3388,16.5912],[120.3548,16.5898],[120.3568,16.5858],[120.3545,16.5818],[120.3448,16.5812],[120.3385,16.5822],[120.3408,16.5865]] },
            { n:'Sacyud',            s:'moderate',      pts:[[120.3548,16.5898],[120.3778,16.5882],[120.3798,16.5838],[120.3775,16.5798],[120.3622,16.5792],[120.3548,16.5802],[120.3568,16.5845]] },
            { n:'Burayoc',           s:'moderate',      pts:[[120.3778,16.5878],[120.3968,16.5862],[120.3988,16.5815],[120.3965,16.5775],[120.3822,16.5768],[120.3778,16.5778],[120.3798,16.5822]] },
        ];

        const features = data.map(b => {
            const ring = [...b.pts];
            if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
                ring.push([ring[0][0], ring[0][1]]);
            }
            const extra = getExtra(b.n);
            return {
                type: 'Feature',
                properties: { name:b.n, status:b.s, area:extra.area, population:extra.pop, district:extra.district, poverty_level: extra.poverty_level },
                geometry: { type:'Polygon', coordinates:[ring] },
            };
        });
        return { type:'FeatureCollection', features };
    }

    /* ============================================================
       20. REAL-TIME REFRESH
       ============================================================ */
    function refreshData() {
        /* Refresh page every 30 seconds to get updated database data */
        window.location.reload();
    }

    /* ============================================================
       21. BOOT
       ============================================================ */
    loadBoundaries();
    /* Auto-refresh every 30 seconds */
    setInterval(refreshData, 30000);

})();
