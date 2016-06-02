/**
 * Converts string to title case.
 *
 * @param  {String} str the string to convert
 * @return {String}
 */
export function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => (
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  ));
}
