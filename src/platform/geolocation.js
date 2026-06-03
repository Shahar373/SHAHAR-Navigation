/* Platform geolocation adapter (M3). Native Android (Capacitor) uses the Geolocation
 * plugin — which requests the runtime permission and reads the device GPS — while the web
 * build falls back to the browser's navigator.geolocation. Same position shape either way
 * ({ coords: { latitude, longitude, accuracy } }), so callers don't branch.
 *
 * @capacitor/core's isNativePlatform() is false on web; the heavy plugin is dynamically
 * imported only on device, so it never weighs on the PWA bundle. */

import { Capacitor } from '@capacitor/core';

/** Start watching position. Returns a stop() function (resolves async on native). */
export async function startWatch(onPos, onErr, opts = {}) {
  const timeout = opts.timeout ?? 10000;
  if (Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const perm = await Geolocation.requestPermissions().catch(() => null);
      if (perm && perm.location === 'denied') {
        onErr?.(new Error('permission denied'));
        return () => {};
      }
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout },
        (pos, err) => {
          if (err) onErr?.(err);
          else if (pos) onPos(pos);
        }
      );
      return () => Geolocation.clearWatch({ id });
    } catch (e) {
      onErr?.(e);
      return () => {};
    }
  }

  if (!navigator.geolocation) {
    onErr?.(new Error('geolocation unavailable'));
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(onPos, onErr, {
    enableHighAccuracy: true,
    maximumAge: opts.maximumAge ?? 2000,
    timeout,
  });
  return () => navigator.geolocation.clearWatch(id);
}
