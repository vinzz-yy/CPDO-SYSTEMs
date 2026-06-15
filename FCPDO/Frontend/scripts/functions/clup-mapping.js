/* ============================================================
   CLUP MAP — San Fernando City, La Union
   Fetches REAL barangay boundary polygons from OpenStreetMap (admin_level=8)
   Uses database performance status for coloring
   ============================================================ */
(function () {
    'use strict';

    /* ============================================================
       1. CONSTANTS & PUROK DATABASE
       ============================================================ */
    const PERFORMANCE_COLORS = {
        high:            { fill:'#10B981', opacity:.65, border:'#000000', label:'High', short:'High' },
        moderate:        { fill:'#F59E0B', opacity:.60, border:'#000000', label:'Moderate', short:'Moderate' },
        needs_attention: { fill:'#EF4444', opacity:.60, border:'#000000', label:'Needs Attention', short:'At Risk' },
    };

    /* San Fernando City, La Union bounding box [S,W,N,E] — wider to include all 59 barangays */
    const BBOX = '16.530,120.260,16.710,120.460';

    /* Overpass API endpoint */
    const OVERPASS = 'https://overpass-api.de/api/interpreter';

    /* Get barangay data from database */
    const DB_BARANGAYS = window.CPDO_CLUP_BARANGAYS || [];
    const DB_BARANGAYS_MAP = {};
    DB_BARANGAYS.forEach(b => {
        DB_BARANGAYS_MAP[b.name.toLowerCase().trim()] = b;
    });

    /* Comprehensive Purok & Sitio Database for San Fernando City's 59 Barangays */
    const PUROKS_DATABASE = {
        'abut': ['Purok Centro', 'Purok Masigasig', 'Purok Pag-asa', 'Sitio Masaya', 'Sitio Central'],
        'apaleng': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Sitio Riverside'],
        'bacsil': ['Purok I', 'Purok II', 'Purok III', 'Purok IV', 'Purok V'],
        'bangbangolan': ['Purok Centro', 'Purok East', 'Purok West', 'Sitio Hillside', 'Sitio Valley View'],
        'bangcusay': ['Purok Baybay', 'Purok Central', 'Purok Maligaya', 'Sitio Seaside', 'Sitio Sunset'],
        'barangay i': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6'],
        'barangay ii': ['Purok I', 'Purok II', 'Purok III', 'Purok IV', 'Purok V'],
        'barangay iii': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5'],
        'barangay iv': ['Purok I', 'Purok II', 'Purok III', 'Purok IV', 'Purok V', 'Purok VI'],
        'baraoas': ['Purok Centro', 'Purok Pag-asa', 'Sitio Proper', 'Sitio Mabuhay'],
        'bato': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Sitio Maligaya'],
        'biday': ['Purok Centro', 'Purok North', 'Purok South', 'Sitio Riverside', 'Sitio Crossing'],
        'birunget': ['Purok I', 'Purok II', 'Purok III', 'Sitio Centro'],
        'bungro': ['Purok 1', 'Purok 2', 'Purok 3', 'Sitio Proper'],
        'cabaroan': ['Purok Centro', 'Purok Masigla', 'Sitio Heights', 'Sitio Valley'],
        'cabarsican': ['Purok I', 'Purok II', 'Purok III', 'Purok IV', 'Sitio Proper'],
        'cadaclan': ['Purok Centro', 'Purok Pag-asa', 'Sitio Maligaya', 'Sitio Riverside'],
        'calabugao': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Sitio Proper'],
        'camansi': ['Purok I', 'Purok II', 'Purok III', 'Sitio Proper'],
        'canaoay': ['Purok Central', 'Purok Seaside', 'Purok Airport Side', 'Sitio Mabuhay'],
        'carlatan': ['Purok Baybay', 'Purok Bridge', 'Purok Central', 'Sitio Sunset'],
        'catbangen': ['Purok Centro', 'Purok Masigasig', 'Purok Pag-asa', 'Purok Riverside', 'Sitio Central'],
        'dallangayan este': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Sitio Proper'],
        'dallangayan oeste': ['Purok I', 'Purok II', 'Purok III', 'Purok IV', 'Sitio Riverside'],
        'dalumpinas este': ['Purok Centro', 'Purok East', 'Purok West', 'Sitio Mabuhay'],
        'dalumpinas oeste': ['Purok Baybay', 'Purok Central', 'Purok Sunset', 'Sitio Seaside'],
        'ilocanos norte': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5'],
        'ilocanos sur': ['Purok I', 'Purok II', 'Purok III', 'Purok IV', 'Purok V'],
        'langcuas': ['Purok Centro', 'Purok Heights', 'Sitio Proper', 'Sitio Valley'],
        'lingsat': ['Purok Baybay', 'Purok Central', 'Purok North', 'Sitio Sunset', 'Sitio Riverside'],
        'madayegdeg': ['Purok Centro', 'Purok Proper', 'Purok Maligaya', 'Sitio Seaside'],
        'mameltac': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Sitio Proper'],
        'masicong': ['Purok I', 'Purok II', 'Purok III', 'Sitio Proper'],
        'nagyubuyuban': ['Purok Centro', 'Purok Pag-asa', 'Sitio Proper', 'Sitio Mabuhay'],
        'namtutan': ['Purok 1', 'Purok 2', 'Purok 3', 'Sitio Proper'],
        'narra este': ['Purok I', 'Purok II', 'Purok III', 'Sitio Proper'],
        'narra oeste': ['Purok 1', 'Purok 2', 'Purok 3', 'Sitio Proper'],
        'pacpaco': ['Purok I', 'Purok II', 'Purok III', 'Purok IV', 'Sitio Proper'],
        'pagdalagan': ['Purok Centro', 'Purok Seaside', 'Sitio Crossing', 'Sitio Proper'],
        'pagdaraoan': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Sitio Proper'],
        'pagudpud': ['Purok I', 'Purok II', 'Purok III', 'Purok IV', 'Sitio Baybay'],
        'pao norte': ['Purok Centro', 'Purok Proper', 'Sitio Proper', 'Sitio Mabuhay'],
        'pao sur': ['Purok 1', 'Purok 2', 'Purok 3', 'Sitio Proper'],
        'parian': ['Purok Centro', 'Purok Proper', 'Purok Crossing', 'Sitio Central'],
        'pias': ['Purok I', 'Purok II', 'Purok III', 'Sitio Proper'],
        'poro': ['Purok Baybay', 'Purok Central', 'Purok Port Side', 'Sitio Point'],
        'puspus': ['Purok 1', 'Purok 2', 'Purok 3', 'Sitio Proper'],
        'sacyud': ['Purok I', 'Purok II', 'Purok III', 'Sitio Proper'],
        'sagayad': ['Purok Centro', 'Purok Proper', 'Sitio Proper', 'Sitio Mabuhay'],
        'san agustin': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Sitio Proper'],
        'san francisco': ['Purok I', 'Purok II', 'Purok III', 'Purok IV', 'Sitio Proper'],
        'san vicente': ['Purok Centro', 'Purok Proper', 'Sitio Proper', 'Sitio Mabuhay'],
        'santiago norte': ['Purok 1', 'Purok 2', 'Purok 3', 'Sitio Proper'],
        'santiago sur': ['Purok I', 'Purok II', 'Purok III', 'Sitio Proper'],
        'saoay': ['Purok Centro', 'Purok Proper', 'Sitio Proper', 'Sitio Mabuhay'],
        'sevilla': ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Sitio Proper'],
        'siboan-otong': ['Purok I', 'Purok II', 'Purok III', 'Sitio Proper'],
        'tanqui': ['Purok Centro', 'Purok Proper', 'Sitio Proper', 'Sitio Mabuhay'],
        'tanquigan': ['Purok 1', 'Purok 2', 'Purok 3', 'Sitio Proper'],
    };

    function getPuroksForBarangay(name) {
        const key = name.toLowerCase().replace(/ (centro|proper)/gi, '').trim();
        if (PUROKS_DATABASE[key]) return PUROKS_DATABASE[key];
        return ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Sitio Proper'];
    }

    /* ============================================================
       2. FUZZY MATCHER & DATA FETCHER
       ============================================================ */
    function findDBBarangay(osmName) {
        if (!osmName) return null;
        
        let cleanOSM = osmName.toLowerCase()
            .replace(/barangay/gi, '')
            .replace(/[^a-z0-9 \-]/gi, '')
            .trim();
        
        // Try exact match first
        if (DB_BARANGAYS_MAP[cleanOSM]) return DB_BARANGAYS_MAP[cleanOSM];

        // Match normalized keys
        for (const dbKey in DB_BARANGAYS_MAP) {
            let cleanDB = dbKey
                .replace(/barangay/gi, '')
                .replace(/[^a-z0-9 \-]/gi, '')
                .trim();
            
            if (cleanOSM === cleanDB || cleanOSM.includes(cleanDB) || cleanDB.includes(cleanOSM)) {
                return DB_BARANGAYS_MAP[dbKey];
            }
        }
        return null;
    }

    function getExtra(name) {
        const dbBarangay = findDBBarangay(name);
        if (dbBarangay) {
            return {
                name: dbBarangay.name,
                area: parseFloat(dbBarangay.area_sqkm) * 100, // Convert sq km to hectares
                pop: parseInt(dbBarangay.population),
                district: dbBarangay.zone,
                poverty_level: dbBarangay.poverty_level,
                performance_status: dbBarangay.performance_status
            };
        }
        return { name: name, area: 0, pop: 0, district: 'San Fernando City' };
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

            // Only map boundaries that match our database barangays
            const dbBarangay = findDBBarangay(name);
            if (!dbBarangay) return;

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

            const status = dbBarangay.performance_status || 'moderate';
            const extra = getExtra(dbBarangay.name);

            features.push({
                type: 'Feature',
                properties: { 
                    name: dbBarangay.name, 
                    status: status, 
                    area: extra.area, 
                    population: extra.pop, 
                    district: extra.district, 
                    poverty_level: extra.poverty_level 
                },
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
        setLoader(true, 'Loading barangay boundary data…');
        setError('');

        /* ---- Try local GeoJSON first (fast, no external dependency) ---- */
        try {
            const localRes = await fetch('../../data/sf-barangays.geojson');
            if (localRes.ok) {
                const localData = await localRes.json();
                if (localData.features && localData.features.length) {
                    /* Enrich with DB performance data */
                    localData.features.forEach(f => {
                        const dbB = findDBBarangay(f.properties.name);
                        if (dbB) {
                            const extra = getExtra(dbB.name);
                            f.properties.name       = dbB.name;
                            f.properties.status     = dbB.performance_status || 'moderate';
                            f.properties.area       = extra.area;
                            f.properties.population = extra.pop;
                            f.properties.district   = extra.district;
                            f.properties.poverty_level = extra.poverty_level;
                        } else {
                            f.properties.status = f.properties.status || 'moderate';
                        }
                    });
                    setLoader(false);
                    buildLayer(localData);
                    return;
                }
            }
        } catch (e) { /* fall through to OSM */ }

        /* ---- OSM Overpass fallback ---- */
        setLoader(true, 'Fetching boundaries from OpenStreetMap…');

        /* Overpass query — admin_level=10 = barangay boundary in Philippines */
        const q = `[out:json][timeout:90];
        (
            relation["boundary"="administrative"]["admin_level"="10"](${BBOX});
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

            if (!geojson.features.length) {
                /* OSM has no admin_level=10 data for this area — try admin_level=9 */
                console.warn('No barangay boundaries at admin_level=10, trying admin_level=9…');
                await loadBoundariesLevel(9);
                return;
            }

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

    async function loadBoundariesLevel(level) {
        const q = `[out:json][timeout:90];
        (
            relation["boundary"="administrative"]["admin_level"="${level}"](${BBOX});
        );
        out body;
        >;
        out skel qt;`;
        try {
            const res = await fetch(OVERPASS + '?data=' + encodeURIComponent(q));
            if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
            const raw = await res.json();
            if (!raw.elements || !raw.elements.length) throw new Error('No data returned at level ' + level);
            const geojson = osmToGeoJSON(raw);
            if (!geojson.features.length) throw new Error('No matching barangays at level ' + level);
            setLoader(false);
            buildLayer(geojson);
        } catch (err) {
            console.warn('Fallback level', level, 'failed:', err.message, '— using built-in data');
            setLoader(true, 'Loading built-in boundary data…');
            setTimeout(() => {
                setLoader(false);
                buildLayer(buildFallbackGeoJSON());
            }, 800);
        }
    }

    /* ============================================================
       6. GEO LAYER & LABEL ZOOM HANDLER
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
            color:       dim ? '#64748b'  : '#000000', // Black borders for active, muted for dim
            weight:      dim ? 0.5     : 2.0,        // Thicker lines for clear boundaries
            opacity:     dim ? 0.3     : 1.0,        // Solid border opacity
            fillColor:   dim ? '#e5e5e5' : c.fill,
            fillOpacity: dim ? 0.12    : c.opacity,
        };
    }

    function updateLabelsZoom() {
        const showPuroks = map.getZoom() >= 15;
        nameLabels.forEach(marker => {
            const p = marker.feature_properties;
            if (p) {
                const puroks = getPuroksForBarangay(p.name);
                const htmlContent = showPuroks 
                    ? `<div class="barangay-name-label" style="font-weight: 800; font-size: 11px;">${p.name}</div>
                       <div class="barangay-puroks-label" style="font-size: 8px; color: #334155; font-weight: 600; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff; max-width: 120px; white-space: normal; line-height: 1.1; margin: 2px auto 0;">${puroks.join(', ')}</div>`
                    : `<div class="barangay-name-label">${p.name}</div>`;
                marker.setIcon(L.divIcon({
                    className: 'barangay-label',
                    html: htmlContent,
                    iconSize: [140, 60],
                    iconAnchor: [70, 30],
                }));
            }
        });
    }

    map.on('zoomend', updateLabelsZoom);

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
                        layer.setStyle({ weight: 3, fillOpacity: 0.85, color: '#000000' });
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
                nameLabel.feature_properties = p; // Keep property reference for zoom
                nameLabels.push(nameLabel);
                nameLabel.addTo(map);
            },
        }).addTo(map);

        // Try to restore saved states or adjust bounds
        const restored = restoreState();
        if (!restored && geoLayer.getBounds().isValid()) {
            map.fitBounds(geoLayer.getBounds(), { padding:[20,20] });
        }

        refreshCounts();
        rebuildList(allFeatures, activeFilter);
        updateLabelsZoom(); // Run zoom check on initial draw
    }

    /* ============================================================
       7. TOOLTIP
       ============================================================ */
    const tipEl = document.getElementById('clupTooltip');

    function showTip(e, p) {
        if (!tipEl) return;
        const c = PERFORMANCE_COLORS[p.status];
        const puroks = getPuroksForBarangay(p.name);
        tipEl.innerHTML =
            `<div class="tooltip-name">${p.name}</div>` +
            `<div class="tooltip-row"><span class="tooltip-label">Status:</span>${c ? c.short : p.status}</div>` +
            `<div class="tooltip-row"><span class="tooltip-label">Land Area:</span>${p.area ? p.area.toFixed(1)+' ha' : 'N/A'}</div>` +
            `<div class="tooltip-row"><span class="tooltip-label">Population:</span>${p.population ? p.population.toLocaleString() : 'N/A'}</div>` +
            `<div class="tooltip-row"><span class="tooltip-label">Poverty:</span>${p.poverty_level ? p.poverty_level : 'N/A'}</div>` +
            `<div class="tooltip-row" style="margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 4px;"><span class="tooltip-label">Puroks:</span>${puroks.slice(0, 3).join(', ')}${puroks.length > 3 ? '...' : ''}</div>`;
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
        if (y + 180 > rect.height) {
            y = ev.clientY - rect.top - 190;
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
        layer.setStyle({ weight: 3, fillOpacity: 0.88, color: '#000000' });

        const puroks = getPuroksForBarangay(p.name);
        const popHtml =
            `<div class="popup-wrap" style="max-width: 250px;">
                <div class="popup-head">
                    <span class="popup-bgy-name">${p.name}</span>
                    <span class="popup-badge ${p.status}">${c.short}</span>
                </div>
                <div class="popup-grid">
                    <div class="popup-stat"><div class="popup-stat-val">${p.area ? p.area.toFixed(1) : '—'}</div><div class="popup-stat-lbl">Area (ha)</div></div>
                    <div class="popup-stat"><div class="popup-stat-val">${p.population ? p.population.toLocaleString() : '—'}</div><div class="popup-stat-lbl">Population</div></div>
                </div>
                <div style="margin-bottom: 10px; max-height: 80px; overflow-y: auto;">
                    <div style="font-weight: 700; font-size: 11px; color: #475569; margin-bottom: 4px;">Puroks:</div>
                    <div style="font-size: 11px; color: #64748b; line-height: 1.4;">${puroks.join(', ')}</div>
                </div>
                <button class="popup-detail-btn" onclick="window._clupDetail(${JSON.stringify(p).replace(/"/g,'&quot;')})">View Full Details</button>
            </div>`;

        layer.bindPopup(popHtml, { maxWidth:260, minWidth:200 }).openPopup();
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
       10. INFO PANEL (DETAILS TAB)
       ============================================================ */
    function showInfoPanel(p) {
        document.getElementById('infoPlaceholder').style.display = 'none';
        const panel = document.getElementById('infoPanelContent');
        panel.classList.add('visible');
        const c = PERFORMANCE_COLORS[p.status];
        const puroks = getPuroksForBarangay(p.name);
        
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
            <div class="info-details" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <div class="info-detail-row"><span class="info-detail-lbl">Barangay</span><span class="info-detail-val">${p.name}</span></div>
                <div class="info-detail-row"><span class="info-detail-lbl">City</span><span class="info-detail-val">San Fernando City</span></div>
                <div class="info-detail-row"><span class="info-detail-lbl">Province</span><span class="info-detail-val">La Union</span></div>
                <div class="info-detail-row"><span class="info-detail-lbl">Region</span><span class="info-detail-val">Ilocos Region (I)</span></div>
                <div class="info-detail-row"><span class="info-detail-lbl">Poverty</span><span class="info-detail-val" style="text-transform: capitalize;">${p.poverty_level || 'N/A'}</span></div>
            </div>
            <div class="info-puroks-section" style="padding: 14px;">
                <div style="font-weight: 700; color: #1e293b; margin-bottom: 10px; font-size: 13px;">
                    <i class="fas fa-map-signs" style="color: #3b82f6; margin-right: 6px;"></i> Puroks & Sitios
                </div>
                <div class="puroks-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${puroks.map(purok => `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #334155; font-weight: 500; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-location-pin" style="color: #ef4444; font-size: 10px;"></i>
                            ${purok}
                        </div>
                    `).join('')}
                </div>
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
            const puroks = getPuroksForBarangay(p.name);
            const el = document.createElement('div');
            el.className = 'bgy-list-item';
            el.dataset.name = p.name;
            el.innerHTML =
                `<span class="bgy-dot ${p.status}"></span>
                 <div style="display: flex; flex-direction: column; gap: 2px;">
                     <div class="bgy-list-name">${p.name}</div>
                     <div style="font-size: 10px; color: #64748b; font-weight: normal; line-height: 1.2;">
                         Puroks: ${puroks.slice(0, 3).join(', ')}${puroks.length > 3 ? '...' : ''}
                     </div>
                 </div>
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
            rebuildList(allFeatures, activeFilter);
            const sel = document.getElementById('bgyFilterSelect');
            if (sel) sel.value = activeFilter;
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
       18. GEOJSON UPLOAD
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
                            const dbBarangay = findDBBarangay(p.name);
                            p.name           = dbBarangay ? dbBarangay.name : p.name;
                            p.status         = dbBarangay ? dbBarangay.performance_status : (p.status || 'moderate');
                            const extra      = getExtra(p.name);
                            p.area           = p.area || extra.area;
                            p.population     = p.population || extra.pop;
                            p.district       = p.district || extra.district;
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
       19. FALLBACK DATA (Simple Irregular Polygons)
       ============================================================ */
    function buildFallbackGeoJSON() {
        const data = [
            { n:'Poro',              s:'high',        pts:[[120.2848,16.6225],[120.2830,16.6120],[120.2845,16.6055],[120.2882,16.6012],[120.2935,16.6005],[120.2962,16.6035],[120.2952,16.6095],[120.2928,16.6152],[120.2888,16.6192],[120.2858,16.6222]] },
            { n:'Ilocanos Norte',    s:'high',        pts:[[120.2958,16.6218],[120.3045,16.6212],[120.3050,16.6175],[120.3005,16.6168],[120.2968,16.6172],[120.2958,16.6196]] },
            { n:'Ilocanos Sur',      s:'moderate',     pts:[[120.2958,16.6172],[120.2978,16.6170],[120.3005,16.6168],[120.3015,16.6148],[120.2985,16.6135],[120.2958,16.6148]] },
            { n:'Barangay I',        s:'moderate',      pts:[[120.3005,16.6212],[120.3045,16.6212],[120.3050,16.6188],[120.3020,16.6182],[120.3005,16.6190]] },
            { n:'Barangay II',       s:'moderate',      pts:[[120.3045,16.6212],[120.3080,16.6208],[120.3078,16.6188],[120.3055,16.6184],[120.3050,16.6188]] },
            { n:'Barangay III',      s:'moderate',      pts:[[120.3005,16.6182],[120.3050,16.6182],[120.3052,16.6162],[120.3022,16.5958],[120.3005,16.6165]] },
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
            { n:'Nagyubuyuban',      s:'moderate',      pts:[[120.3938,16.6092],[120.4178,16.6078],[120.4195,16.5935],[120.4172,16.5995],[120.4018,16.5988],[120.3938,16.6000],[120.3958,16.6042]] },
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
            const dbBarangay = findDBBarangay(b.n);
            const status = dbBarangay ? dbBarangay.performance_status : b.s;
            const extra = getExtra(b.n);
            
            return {
                type: 'Feature',
                properties: { 
                    name: dbBarangay ? dbBarangay.name : b.n, 
                    status: status, 
                    area: extra.area, 
                    population: extra.pop, 
                    district: extra.district, 
                    poverty_level: extra.poverty_level 
                },
                geometry: { type:'Polygon', coordinates:[ring] },
            };
        });
        return { type:'FeatureCollection', features };
    }

    /* ============================================================
       20. REAL-TIME REFRESH
       ============================================================ */
    function refreshData() {
        /* Recolor existing polygons using updated DB data without reloading the page */
        if (geoLayer) {
            geoLayer.setStyle(styleFor);
            refreshCounts();
        }
    }

    /* ============================================================
       21. STATE PRESERVATION (BEFORE UNLOAD & RESTORE)
       ============================================================ */
    // Save map state before unload
    window.addEventListener('beforeunload', () => {
        const state = {
            center: map.getCenter(),
            zoom: map.getZoom(),
            selectedName: selectedLyr ? selectedLyr.feature.properties.name : null,
            activeTab: document.querySelector('.sidebar-tab.active')?.dataset.tab || 'legend',
            activeFilter: activeFilter
        };
        sessionStorage.setItem('clup_map_state', JSON.stringify(state));
    });

    // Restore map state on load
    function restoreState() {
        const stateStr = sessionStorage.getItem('clup_map_state');
        if (!stateStr) return false;
        try {
            const state = JSON.parse(stateStr);
            if (state.center && state.zoom) {
                map.setView([state.center.lat, state.center.lng], state.zoom);
            }
            if (state.activeTab) {
                activateTab(state.activeTab);
            }
            if (state.activeFilter && state.activeFilter !== 'all') {
                const pill = document.querySelector(`.filter-pill[data-cls="${state.activeFilter}"]`);
                if (pill) {
                    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    activeFilter = state.activeFilter;
                }
            }
            if (state.selectedName) {
                // Wait for layers to draw
                const interval = setInterval(() => {
                    if (geoLayer) {
                        geoLayer.eachLayer(layer => {
                            if (layer.feature && layer.feature.properties.name === state.selectedName) {
                                selectBgy(layer, layer.feature.properties);
                                clearInterval(interval);
                            }
                        });
                    }
                }, 100);
                setTimeout(() => clearInterval(interval), 5000);
            }
            // Clear state after reading so manual refreshes are clean
            sessionStorage.removeItem('clup_map_state');
            return true;
        } catch (e) {
            console.error('Failed to restore map state:', e);
            sessionStorage.removeItem('clup_map_state');
            return false;
        }
    }

    /* ============================================================
       22. BOOT
       ============================================================ */
    loadBoundaries();
    /* Auto-refresh every 30 seconds */
    setInterval(refreshData, 30000);

})();
