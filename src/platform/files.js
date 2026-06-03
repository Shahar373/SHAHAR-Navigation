/* Platform file save (M3). On native Android (Capacitor) GPX/GeoJSON/JSON exports are
 * written to the device Documents folder via the Filesystem plugin; on web they download
 * through a Blob link as before. Returns { native, path } so the caller can tailor the
 * toast. Never throws — falls back to the web download if the native write fails. */

import { Capacitor } from '@capacitor/core';

export async function saveTextFile(name, text, mime) {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      await Filesystem.writeFile({
        path: name,
        data: text,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      return { native: true, path: name };
    } catch {
      /* fall through to the web download */
    }
  }
  const blob = new Blob([text], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  return { native: false, path: name };
}
