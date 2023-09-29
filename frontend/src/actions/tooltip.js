import { ensureRectVisibleInWindow } from "./ensurevisible.js";

function validatePosition(s) {
  if (s === "bottom" || s === "top") {
    return s;
  }
  console.log("Unknown position:", s);
  return "bottom";
}

export function tooltip(node, args) {
  let text = "";
  let position = "bottom";
  if (typeof args === "string") {
    text = args;
  } else {
    text = args.text;
    position = args.position || "bottom";
  }
  position = validatePosition(position);
  const tooltip = document.createElement("div");
  tooltip.textContent = text;

  Object.assign(tooltip.style, {
    position: "absolute",
    background: "#fcfcfc",
    color: "black",
    padding: "0.5em 1em",
    fontSize: "12px",
    zIndex: "199",
    border: "2px solid #eeeeee",
    pointerEvents: "none",
    width: "fit-content",
    borderRadius: "2px",
    // transition: 'opacity 0.4s'
  });

  function setPosition() {
    let trect = tooltip.getBoundingClientRect();
    // console.log("trect:", trect);
    const { left, right, top, bottom } = node.getBoundingClientRect();
    const dy = top - bottom;
    let tleft = (left + right) / 2;
    tleft -= trect.width / 2;
    trect.x = tleft;
    if (position === "bottom") {
      const ttop = bottom + 8;
      trect.y = ttop;
      const { x, y } = ensureRectVisibleInWindow(trect);
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    } else {
      const ttop = top + dy - 8;
      trect.y = ttop;
      const { x, y } = ensureRectVisibleInWindow(trect);
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    }
  }

  function append() {
    document.body.appendChild(tooltip);
    tooltip.style.opacity = "0";
    function makeVisible() {
      tooltip.style.opacity = "1";
    }
    setTimeout(makeVisible, 1000);
    setPosition();
  }

  function remove() {
    tooltip.remove();
  }

  node.addEventListener("mouseenter", append);
  node.addEventListener("mouseleave", remove);

  return {
    update(text) {
      tooltip.textContent = text;
      setPosition();
    },

    destroy() {
      tooltip.remove();
      node.removeEventListener("mouseenter", append);
      node.removeEventListener("mouseleave", remove);
    },
  };
}
