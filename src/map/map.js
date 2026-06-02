/* Leaflet map + base layers + OpenSeaMap seamark overlay + controls (L421–430, L517). */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { bindTog } from '../ui/dom.js';

export const map = L.map('map', {
  zoomControl: true,
  attributionControl: true,
  doubleClickZoom: false,
}).setView([32.205, 34.79], 12.2);

const base = {
  'מפה (OSM)': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    className: 'base-tiles',
    attribution: '© OpenStreetMap',
  }),
  'לוויין (Esri)': L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, className: 'base-tiles', attribution: '© Esri' }
  ),
  טופוגרפי: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    className: 'base-tiles',
    attribution: '© OpenTopoMap',
  }),
};

export const seamark = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
  maxZoom: 18,
  className: 'seamark-tiles',
  attribution: '© OpenSeaMap',
});

export function init() {
  base['מפה (OSM)'].addTo(map);
  seamark.addTo(map);
  L.control.layers(base, null, { position: 'topleft', collapsed: true }).addTo(map);
  L.control
    .scale({ metric: true, imperial: false, position: 'bottomleft', maxWidth: 140 })
    .addTo(map);

  bindTog(
    'tgSeamark',
    () => seamark.addTo(map),
    () => seamark.remove()
  );
}
