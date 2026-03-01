/**
 * Trip renderer — reads window.TRIP and builds the full card HTML.
 *
 * Data schema: see hikes/zugspitze/index.html for a complete example.
 */
(function () {
  const T = window.TRIP;
  if (!T) {
    document.body.innerHTML =
      '<p style="padding:2rem;font-family:sans-serif;color:#c00">' +
      'No TRIP data found. Define <code>window.TRIP = { … }</code> before this script.</p>';
    return;
  }

  document.title = T.title + (T.region ? ' — ' + T.region : '');

  /* ── UI strings (dansk som standard, override via T.ui) ───── */
  const UI = Object.assign({
    navOverview:  'Overblik',
    navPractical: 'Praktisk',
    overviewH3:   '📅 Tursoverblik',
    beforeYouGo:  'Inden afgang',
    checklist:    'Tjekliste',
    resources:    'Ressourcer',
    usefulLinks:  'Nyttige links',
    mapLoading:   'Indlæser kort…',
    mapHint:      'Klik og træk for at navigere · Zoom med + / −',
  }, T.ui || {});

  /* ── helpers ─────────────────────────────────────────────── */
  const EXT_ICON =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' +
    '<polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

  function host(url) {
    try { return new URL(url).hostname; } catch { return url; }
  }

  function pill(p) {
    if (typeof p === 'string') return `<span class="dpill">${p}</span>`;
    return `<span class="dpill${p.warn ? ' warn' : ''}">${p.text}</span>`;
  }

  function linkBtn(l) {
    return `<a class="ext-link${l.blue ? ' blue' : ''}" href="${l.url}" target="_blank">${EXT_ICON} ${l.label}</a>`;
  }

  /* ── cover ───────────────────────────────────────────────── */
  function cover(T) {
    const img = T.coverImage
      ? `<img class="cover-img" src="${T.coverImage}" alt="${T.title}">`
      : '';
    const meta = [T.region, T.dateRange, T.difficulty].filter(Boolean).join(' · ');
    const stats = (T.stats || []).map(s =>
      `<div class="cd"><div class="cd-n">${s.value}</div><div class="cd-l">${s.label}</div></div>`
    ).join('');
    return `
      <div class="cover">
        ${img}
        <div class="c-badge">${T.badge || ''}</div>
        <div class="c-title">${T.title}</div>
        <div class="c-sub">${meta}</div>
        <div class="c-dates">${stats}</div>
      </div>`;
  }

  /* ── sticky nav ──────────────────────────────────────────── */
  function nav(T) {
    const dayLinks = (T.days || []).map(d =>
      `<a href="#${d.id}" class="nl">${d.navLabel || d.date}</a>`
    ).join('');
    const practicalLink = T.practical ? `<a href="#practical" class="nl">${UI.navPractical}</a>` : '';
    return `
      <nav class="nav">
        <div class="nav-i">
          <a href="#overview" class="nl">${UI.navOverview}</a>
          ${dayLinks}
          ${practicalLink}
        </div>
      </nav>`;
  }

  /* ── overview strip ──────────────────────────────────────── */
  function overview(T) {
    const days = (T.days || []).map(d => `
      <div class="ov-day ${d.type || 'hike'}-day">
        <div class="ov-icon">${d.overviewIcon || '🥾'}</div>
        <div class="ov-date">${d.navLabel || ''}</div>
        <div class="ov-label">${d.overviewLabel || ''}</div>
      </div>`).join('');
    return `
      <div id="overview" class="overview">
        <h3>${UI.overviewH3}</h3>
        <div class="ov-row">${days}</div>
      </div>`;
  }

  /* ── day body content ────────────────────────────────────── */
  function dayBody(d) {
    let out = '';

    // Images
    if (d.images && d.images.length) {
      const imgs = d.images.map((src, i) =>
        `<img class="day-img${i === 0 && d.images.length === 1 ? ' full' : ''}" src="${src}" loading="lazy">`
      ).join('');
      out += `<div class="day-images">${imgs}</div>`;
    }

    // Description paragraph
    if (d.description) out += `<div class="day-desc">${d.description}</div>`;

    // Drive timeline
    if (d.timeline && d.timeline.length) {
      const steps = d.timeline.map((s, i, a) => `
        <div class="dtl-step">
          <div class="dtl-time">${s.time || ''}</div>
          <div class="dtl-dot-col">
            <div class="dtl-dot${s.final ? ' green' : ''}"></div>
            ${i < a.length - 1 ? '<div class="dtl-line"></div>' : ''}
          </div>
          <div class="dtl-txt"><strong>${s.label}</strong><span>${s.detail || ''}</span></div>
        </div>`).join('');
      out += `<div class="drive-tl">${steps}</div>`;
    }

    // Bullet highlights
    if (d.highlights && d.highlights.length) {
      out += `<ul class="route-list">${d.highlights.map(h => `<li>${h}</li>`).join('')}</ul>`;
    }

    // Tip / info callouts
    if (d.tip)  out += `<div class="tip-box">${d.tip}</div>`;
    if (d.info) out += `<div class="info-box">${d.info}</div>`;

    // Accommodation — single object or array
    if (d.accommodation) {
      const accs = Array.isArray(d.accommodation) ? d.accommodation : [d.accommodation];
      out += accs.map(a => `
        <div class="hotel-row">
          <span class="hotel-ico">${a.icon || '🏨'}</span>
          <div>
            <div class="hotel-name">${a.name}</div>
            <div class="hotel-desc">${a.desc || ''}</div>
          </div>
        </div>`).join('');
    }

    // External links
    if (d.links && d.links.length) {
      out += `<div class="links-row">${d.links.map(linkBtn).join('')}</div>`;
    }

    return out;
  }

  /* ── single day card ─────────────────────────────────────── */
  function dayCard(d) {
    return `
      <div id="${d.id}" class="day-card ${d.type || 'hike'}">
        <div class="day-hd">
          <div class="dc-top">
            <div class="dc-left">
              <div class="dc-date">${d.date || ''}</div>
              <div class="dc-title">${d.title}</div>
              <div class="dc-sub">${d.subtitle || ''}</div>
            </div>
          </div>
          <div class="dc-pills">${(d.pills || []).map(pill).join('')}</div>
        </div>
        <div class="day-body">${dayBody(d)}</div>
      </div>`;
  }

  /* ── practical section ───────────────────────────────────── */
  function practical(T) {
    const p = T.practical;
    if (!p) return '';
    let out = '<div id="practical">';

    // Logistics blocks
    (p.logistics || []).forEach(sec => {
      const items = (sec.items || []).map(item => `
        <div class="logi-row">
          <span class="logi-ico">${item.icon || ''}</span>
          <div class="logi-t">
            <strong>${item.label}</strong>
            <span>${item.detail || ''}</span>
          </div>
        </div>`).join('');
      out += `
        <div class="sh">
          <div class="sl">${sec.category || 'Practical'}</div>
          <div class="st">${sec.title}</div>
        </div>
        <div class="logi-wrap">
          <div class="logi-box">
            <h3>${sec.icon ? sec.icon + ' ' : ''}${sec.title}</h3>
            ${items}
          </div>
        </div>`;
    });

    // Checklist
    if (p.checklist && p.checklist.length) {
      out += `
        <div class="clist">
          <div class="sl">${UI.beforeYouGo}</div>
          <div class="st">${UI.checklist}</div>
          <div class="cl-grid">
            ${p.checklist.map(item => `<div class="cl-item"><span class="clc">✔</span>${item}</div>`).join('')}
          </div>
        </div>`;
    }

    // Useful links
    if (p.links && p.links.length) {
      out += `
        <div class="useful">
          <div class="sl">${UI.resources}</div>
          <div class="st">${UI.usefulLinks}</div>
          <div class="link-grid">
            ${p.links.map(l => `
              <a class="lc" href="${l.url}" target="_blank">
                <div class="lc-label">${l.category || ''}</div>
                <div class="lc-title">${l.title}</div>
                <div class="lc-url">${l.urlLabel || host(l.url)}</div>
              </a>`).join('')}
          </div>
        </div>`;
    }

    out += '</div>';
    return out;
  }

  /* ── footer ──────────────────────────────────────────────── */
  function footer(T) {
    const f = T.footer || {};
    return `
      <div class="foot">
        <div>
          <div class="foot-t">${f.subtitle || T.title}</div>
          ${f.detail ? `<div class="foot-d">${f.detail}</div>` : ''}
        </div>
        <div class="foot-r">${f.icon || '🥾'}<br>${(T.stats || [])[0]?.value || ''} days</div>
      </div>`;
  }

  /* ── map section (HTML placeholder) ─────────────────────── */
  function mapSection(T) {
    if (!T.map) return '';
    const m = T.map;
    const label = m.label || 'Ruteoverblik';
    const title = m.title || 'Kort';
    const hasGpx = m.gpxRoutes && m.gpxRoutes.length;
    return `
      <div class="map-wrap">
        <div class="sh">
          <div class="sl">${label}</div>
          <div class="st">${title}</div>
        </div>
        <div id="trip-map" class="trip-map">
          <div class="map-loading">${UI.mapLoading}</div>
        </div>
        ${hasGpx ? '<div id="map-stats" class="map-stats"></div>' : ''}
        <div class="map-hint">${UI.mapHint}</div>
      </div>`;
  }

  /* ── render ──────────────────────────────────────────────── */
  document.body.innerHTML = `
    <div class="card">
      ${cover(T)}
      ${nav(T)}
      ${overview(T)}
      ${(T.days || []).map(dayCard).join('')}
      ${practical(T)}
      ${mapSection(T)}
      ${footer(T)}
    </div>`;

  /* ── map initialisation (runs after innerHTML is set) ────── */
  if (T.map) initMap(T.map);

})();

/* ── Leaflet map ──────────────────────────────────────────── */
function loadLeaflet(cb) {
  if (window.L) { cb(); return; }

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(css);

  const js = document.createElement('script');
  js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  js.onload = cb;
  document.head.appendChild(js);
}

function markerIcon(type) {
  const palette = {
    start:   '#2d4a2d',
    end:     '#2d4a2d',
    hut:     '#7a4020',
    hotel:   '#5a4a30',
    waypoint:'#2a3a5a',
  };
  const bg = palette[type] || palette.waypoint;
  // Slightly larger dot for start/end
  const size = (type === 'start' || type === 'end') ? 14 : 11;
  const half = size / 2;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border:2.5px solid #fff;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,.45)"></div>`,
    iconSize:    [size, size],
    iconAnchor:  [half, half],
    popupAnchor: [0, -(half + 4)],
    className:   '',
  });
}

function loadLeafletGpx(cb) {
  loadLeaflet(function () {
    if (window.L.GPX) { cb(); return; }
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet-gpx@2.1.2/gpx.js';
    js.onload = cb;
    document.head.appendChild(js);
  });
}

function renderMapStats(routes) {
  const el = document.getElementById('map-stats');
  if (!el || !routes.length) return;
  el.innerHTML = routes.map(function (r) {
    const km   = r.distance != null ? (r.distance / 1000).toFixed(1) + ' km' : '–';
    const elev = r.elevation != null ? '↑ ' + Math.round(r.elevation) + ' m' : '';
    return '<div class="ms-item">' +
      '<span class="ms-dot" style="background:' + r.color + '"></span>' +
      '<span class="ms-label">' + r.label + '</span>' +
      '<span class="ms-stat">' + km + '</span>' +
      (elev ? '<span class="ms-stat">' + elev + '</span>' : '') +
      '</div>';
  }).join('');
}

function initMap(m) {
  const useGpx = m.gpxRoutes && m.gpxRoutes.length;
  const loader = useGpx ? loadLeafletGpx : loadLeaflet;

  loader(function () {
    const el = document.getElementById('trip-map');
    if (!el) return;

    el.innerHTML = '';

    const map = L.map('trip-map', {
      center:          m.center || [51, 10],
      zoom:            m.zoom   || 11,
      scrollWheelZoom: false,
      zoomControl:     true,
    });

    el.addEventListener('mouseenter', function () { map.scrollWheelZoom.enable(); });
    el.addEventListener('mouseleave', function () { map.scrollWheelZoom.disable(); });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // ── GPX routes (real tracks) ───────────────────────────
    if (useGpx) {
      const allBounds = [];
      const stats     = [];
      let loaded = 0;
      const total = m.gpxRoutes.length;

      function onAllDone() {
        if (allBounds.length) {
          var combined = allBounds[0];
          for (var j = 1; j < allBounds.length; j++) combined.extend(allBounds[j]);
          map.fitBounds(combined, { padding: [24, 24] });
        }
        renderMapStats(stats.filter(Boolean));
      }

      m.gpxRoutes.forEach(function (route, i) {
        new L.GPX(route.file, {
          async: true,
          polyline_options: { color: route.color || '#2d5a30', weight: 3.5, opacity: 0.85 },
          marker_options:   { startIconUrl: null, endIconUrl: null, shadowUrl: null },
        }).on('loaded', function (e) {
          allBounds.push(e.target.getBounds());
          stats[i] = {
            label:     route.label,
            color:     route.color || '#2d5a30',
            distance:  e.target.get_distance(),
            elevation: e.target.get_elevation_gain(),
          };
          if (++loaded === total) onAllDone();
        }).on('error', function () {
          stats[i] = null;
          if (++loaded === total) onAllDone();
        }).addTo(map);
      });
    }

    // ── Manual segments (fallback / drive lines) ───────────
    if (m.segments && m.segments.length) {
      m.segments.forEach(function (seg) {
        L.polyline(seg.coords, {
          color:     seg.color  || '#2d4a2d',
          weight:    seg.weight || 3,
          opacity:   0.85,
          dashArray: seg.dashed ? '7 5' : null,
        }).addTo(map);
      });
    }

    // ── Waypoint markers ───────────────────────────────────
    (m.waypoints || []).forEach(function (w) {
      const marker = L.marker([w.lat, w.lng], { icon: markerIcon(w.type) }).addTo(map);
      if (w.label) {
        marker.bindPopup(
          '<strong style="font-family:sans-serif;font-size:12px;color:#1b2e1b">' + w.label + '</strong>' +
          (w.desc ? '<br><span style="font-size:11px;color:#607060">' + w.desc + '</span>' : '')
        );
      }
    });

    // Auto-fit from waypoints if no GPX and no explicit center
    if (!useGpx && !m.center && m.waypoints && m.waypoints.length) {
      map.fitBounds(
        m.waypoints.map(function (w) { return [w.lat, w.lng]; }),
        { padding: [24, 24] }
      );
    }
  });
}
