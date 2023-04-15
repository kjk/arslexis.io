<script context="module">
  export function gtooltip(node, html) {
    let tooltip = document.getElementById("global_tooltip");

    function hide() {
      tooltip.classList.add("hidden");
    }

    function show() {
      tooltip.innerHTML = html;
      tooltip.classList.remove("hidden");
    }

    node.addEventListener("mouseenter", show);
    node.addEventListener("mouseleave", hide);

    return {
      update(text) {
        tooltip.innerHTML = text;
      },

      destroy() {
        node.removeEventListener("mouseenter", show);
        node.removeEventListener("mouseleave", hide);
        hide();
      },
    };
  }
</script>

<div
  id="global_tooltip"
  class="hidden fixed right-1 bottom-1 px-3 py-1 bg-yellow-200 text-gray-700 z-10"
/>
