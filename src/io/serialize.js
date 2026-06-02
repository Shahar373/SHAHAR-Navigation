/* Pure (de)serialization for GPX / GeoJSON / native JSON. No Leaflet / DOM-app deps,
 * so it is unit-testable in isolation. `parseRoute` uses the standard `DOMParser`,
 * provided by the browser at runtime and by jsdom in tests. */

const xmlEscape = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Native JSON: { name, waypoints:[...] } (runtime _id stripped). */
export function toJson(state) {
  return JSON.stringify(
    { name: state.name, waypoints: state.wpts.map(({ _id, ...w }) => w) },
    null,
    1
  );
}

/** GeoJSON FeatureCollection: Point per waypoint + a LineString of the route. */
export function toGeoJson(state) {
  const feats = state.wpts.map((w, i) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [w.lon, w.lat] },
    properties: {
      seq: i + 1,
      name_he: w.name,
      type: w.type,
      vhf: w.vhf,
      action: w.action,
      depth: w.depth,
    },
  }));
  feats.push({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: state.wpts.map((w) => [w.lon, w.lat]) },
    properties: { name_he: state.name },
  });
  return JSON.stringify({ type: 'FeatureCollection', name: state.name, features: feats }, null, 1);
}

/** GPX 1.1 with both <wpt> and a <rte>. */
export function toGpx(state) {
  let g =
    '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="MarineNavPro" xmlns="http://www.topografix.com/GPX/1/1">\n';
  state.wpts.forEach(
    (w, i) =>
      (g += `  <wpt lat="${w.lat}" lon="${w.lon}"><name>WP${String(i + 1).padStart(2, '0')}</name><desc>${xmlEscape(w.name)}</desc></wpt>\n`)
  );
  g += `  <rte><name>${xmlEscape(state.name)}</name>\n`;
  state.wpts.forEach(
    (w, i) =>
      (g += `    <rtept lat="${w.lat}" lon="${w.lon}"><name>WP${String(i + 1).padStart(2, '0')}</name></rtept>\n`)
  );
  g += '  </rte>\n</gpx>';
  return g;
}

/** Parse GPX/GeoJSON/JSON text into { name, wpts }. Pure — no app state mutated. */
export function parseRoute(text, fname) {
  let wpts = null,
    name = fname.replace(/\.[^.]+$/, '');
  const lower = fname.toLowerCase();
  if (lower.endsWith('.gpx') || /^<\?xml|<gpx/i.test(text.trim())) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    let nodes = [...doc.querySelectorAll('rtept')];
    if (!nodes.length) nodes = [...doc.querySelectorAll('trkpt')];
    if (!nodes.length) nodes = [...doc.querySelectorAll('wpt')];
    wpts = nodes.map((n) => ({
      lat: +n.getAttribute('lat'),
      lon: +n.getAttribute('lon'),
      name: (n.querySelector('name') || {}).textContent || 'נקודה',
      type: 'cruise',
      vhf: '16',
      action: '',
      depth: '—',
    }));
    const rn = doc.querySelector('rte > name');
    if (rn) name = rn.textContent;
  } else {
    const j = JSON.parse(text);
    if (j.type === 'FeatureCollection') {
      const pf = j.features.filter((f) => f.geometry && f.geometry.type === 'Point');
      if (pf.length) {
        pf.sort((a, b) => (a.properties.seq || 0) - (b.properties.seq || 0));
        wpts = pf.map((f) => ({
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          name: f.properties.name_he || f.properties.name || 'נקודה',
          type: f.properties.type || 'cruise',
          vhf: String(f.properties.vhf || '16'),
          action: f.properties.action || '',
          depth: f.properties.depth || '—',
        }));
      } else {
        const lf = j.features.find((f) => f.geometry && f.geometry.type === 'LineString');
        if (lf)
          wpts = lf.geometry.coordinates.map((c, i) => ({
            lat: c[1],
            lon: c[0],
            name: 'נקודה ' + (i + 1),
            type: 'cruise',
            vhf: '16',
            action: '',
            depth: '—',
          }));
      }
      if (j.name) name = j.name;
    } else if (j.waypoints) {
      wpts = j.waypoints;
      if (j.name) name = j.name;
    }
  }
  return { wpts, name };
}
