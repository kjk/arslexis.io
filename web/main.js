import "./base.css";

if (location.host.includes("localhost")) {
  let el = document.getElementById("in-progress");
  el.classList.remove("hidden");
}
