export function prstr(s) {
  let res = "'";
  for (let c of s) {
    if (c == "\n") {
      res += "\\n";
    } else if (c == "\t") {
      res += "\\t";
    } else {
      res += c;
    }
  }
  return res + "'";
}
