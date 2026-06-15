/* ============================================================
   ECONOMIC PERFORMANCE — Charts, KPIs, Insights
   ============================================================ */
(function () {
    'use strict';

    /* ===========================================================
       1. SHARED CHART HELPERS (from dashboard-overview.js)
    =========================================================== */
    function setCanvasSize(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width  = rect.width  * dpr;
        canvas.height = rect.height * dpr;
        canvas.getContext('2d').scale(dpr, dpr);
    }

    function clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /* --- Multi-Line Chart --- */
    function drawMultiLineChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        setCanvasSize(canvas);
        const ctx = canvas.getContext('2d');
        const W   = canvas.getBoundingClientRect().width;
        const H   = canvas.getBoundingClientRect().height;

        const pad  = { top: 40, right: 20, bottom: 40, left: 60 };
        const cW   = W - pad.left - pad.right;
        const cH   = H - pad.top  - pad.bottom;

        const labels = data.labels;
        const datasets = data.datasets;

        const step = cW / (labels.length - 1);
        function xPos(i) { return pad.left + i * step; }

        clearCanvas(ctx, canvas);

        /* Grid lines */
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth   = 1;
        const ticks = 5;
        for (let t = 0; t <= ticks; t++) {
            const y   = pad.top + (cH / ticks) * t;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + cW, y);
            ctx.stroke();
        }

        /* Draw each dataset with their own scale */
        datasets.forEach(function (ds) {
            const color = ds.color;
            const min = Math.min(...ds.values) * 0.95;
            const max = Math.max(...ds.values) * 1.05;
            const range = max - min || 1;

            function yPos(v) { return pad.top + cH - ((v - min) / range) * cH; }

            /* Fill area under line */
            ctx.beginPath();
            ctx.moveTo(xPos(0), yPos(ds.values[0]));
            ds.values.forEach(function (v, i) { ctx.lineTo(xPos(i), yPos(v)); });
            ctx.lineTo(xPos(ds.values.length - 1), pad.top + cH);
            ctx.lineTo(xPos(0), pad.top + cH);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
            grad.addColorStop(0, color + '15');
            grad.addColorStop(1, color + '00');
            ctx.fillStyle = grad;
            ctx.fill();

            /* Line */
            ctx.beginPath();
            ctx.moveTo(xPos(0), yPos(ds.values[0]));
            ds.values.forEach(function (v, i) { if (i > 0) ctx.lineTo(xPos(i), yPos(v)); });
            ctx.strokeStyle = color;
            ctx.lineWidth   = 2.5;
            ctx.lineJoin    = 'round';
            ctx.lineCap     = 'round';
            ctx.stroke();

            /* Dots */
            ds.values.forEach(function (v, i) {
                ctx.beginPath();
                ctx.arc(xPos(i), yPos(v), 4, 0, Math.PI * 2);
                ctx.fillStyle   = '#fff';
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth   = 2.5;
                ctx.stroke();
            });
        });

        /* X labels */
        ctx.fillStyle = '#64748b';
        ctx.font      = '12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        labels.forEach(function (lbl, i) {
            if (i % Math.ceil(labels.length / 8) === 0 || i === labels.length - 1) {
                ctx.fillText(lbl, xPos(i), H - pad.bottom + 18);
            }
        });

        /* Draw legend */
        const legendX = pad.left;
        const legendY = 10;
        let legendOffset = 0;
        datasets.forEach(function (ds) {
            ctx.fillStyle = ds.color;
            ctx.fillRect(legendX + legendOffset, legendY, 16, 4);
            ctx.fillStyle = '#1e293b';
            ctx.font = '13px system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(ds.label, legendX + legendOffset + 22, legendY + 12);
            legendOffset += 150;
        });
    }

    /* --- Bar Chart --- */
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

    /* --- Donut Chart (Sector Contribution) --- */
    function drawDonutChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        setCanvasSize(canvas);
        const ctx = canvas.getContext('2d');
        const W = canvas.getBoundingClientRect().width;
        const H = canvas.getBoundingClientRect().height;
        const cx = W / 2;
        const cy = H / 2;
        const radius = Math.min(cx, cy) - 10;
        const innerRadius = radius * 0.6;

        const colors = ['#3b82f6', '#10b981', '#f59e0b'];
        const total = data.values.reduce((sum, val) => sum + val, 0);
        let startAngle = -Math.PI / 2;

        clearCanvas(ctx, canvas);

        data.values.forEach(function (value, index) {
            const sliceAngle = (value / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();

            startAngle = endAngle;
        });

        /* Center text */
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('100%', cx, cy);
    }

    /* ===========================================================
       2. INITIALIZE ALL CHARTS
    =========================================================== */
    function initCharts() {
        /* GDP & Inflation Chart (Multi-Line) */
        drawMultiLineChart('gdpInflationChart', {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'GDP growth',
                    values: [6.0, 6.1, 6.2, 6.5, 6.7, 6.8],
                    color: '#3b82f6'
                },
                {
                    label: 'Inflation rate',
                    values: [5.5, 5.3, 5.1, 4.8, 4.5, 4.2],
                    color: '#ef4444'
                },
                {
                    label: 'Employment rate',
                    values: [93.0, 93.5, 93.5, 94.0, 94.2, 94.5],
                    color: '#10b981'
                }
            ]
        });

        /* Sector Contribution Chart (Donut) */
        drawDonutChart('sectorChart', {
            values: [55, 31, 14],
            labels: ['Services', 'Industry', 'Agriculture']
        });

        /* Investment Inflow Bar Chart */
        drawBarChart('investmentChart', {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            values: [320, 350, 380, 420, 480, 517],
            color: '#93c5fd',
            hlColor: '#1d4ed8'
        });
    }

    /* ===========================================================
       3. BOOT — Run after DOM is ready
    =========================================================== */
    function boot() {
        initCharts();

        /* Redraw charts on window resize (debounced) */
        let resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                initCharts();
            }, 200);
        });
    }

    /* Real-time refresh: reload page every 30 seconds for updated data */
    function refreshPage() {
        window.location.reload();
    }
    setInterval(refreshPage, 30000);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());
