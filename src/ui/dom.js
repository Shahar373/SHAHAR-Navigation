/* Small DOM helpers shared across modules. */

export const $ = (id) => document.getElementById(id);

/** Bind a checkbox toggle to on()/off() callbacks (L516). */
export function bindTog(id, on, off) {
  $(id).onchange = (e) => (e.target.checked ? on() : off());
}
