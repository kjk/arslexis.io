/**
 *
 * @param {Date} d
 * @returns {string}
 */
export function niceDate(d) {
  /**
   * @param {number} n
   * @returns
   */
  function pad(n) {
    let s = String(n);
    if (s.length === 1) {
      s = "0" + s;
    }
    return s;
  }

  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
