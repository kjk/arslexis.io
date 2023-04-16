export function patchDenoLibJS(code) {
  return code.replaceAll("/(?<=\\n)/", "/()/");
}
