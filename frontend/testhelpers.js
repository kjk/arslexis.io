import ist from "ist";

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

export function prstrNonEq(got, want) {
  if (got !== want) {
    console.log("want:", prstr(want));
    console.log("got :", prstr(got));
  }
}

export function streq(got, want) {
  if (got !== want) {
    console.log("want:", prstr(want));
    console.log("got :", prstr(got));
  }
  ist(got, want);
}
