<script>
  import { onMount } from "svelte";
  import { tooltip } from "../actions/tooltip";
  import {
    IDT_EDIT_COPY,
    IDT_EDIT_CUT,
    IDT_EDIT_DELETE,
    IDT_EDIT_FIND,
    IDT_EDIT_PASTE,
    IDT_EDIT_REDO,
    IDT_EDIT_REPLACE,
    IDT_EDIT_UNDO,
    IDT_FILE_ADDTOFAV,
    IDT_FILE_BROWSE,
    IDT_FILE_EXIT,
    IDT_FILE_LAUNCH,
    IDT_FILE_NEW,
    IDT_FILE_OPEN,
    IDM_FILE_OPENFAV,
    IDT_FILE_PRINT,
    IDT_FILE_SAVE,
    IDT_FILE_SAVEAS,
    IDT_FILE_SAVECOPY,
    IDT_VIEW_ALWAYSONTOP,
    IDT_VIEW_SCHEME,
    IDT_VIEW_SCHEMECONFIG,
    IDT_VIEW_TOGGLEFOLDS,
    IDT_VIEW_WORDWRAP,
    IDT_VIEW_ZOOMIN,
    IDT_VIEW_ZOOMOUT,
  } from "./menu-notepad2";
  import { len, throwIf } from "../util";

  export let show = false;
  /** @typw {Function} */
  export let isMenuEnabled;
  export let handleMenuCmd;
  export let wordWrap;

  let isToolbarReady = false;

  async function setToolbarEnabledState() {
    if (!isToolbarReady) {
      return;
    }
    // TODO: document must be focused to call this
    // maybe get this from codemirror
    // hasClipboard = (await getClipboard()) !== "";
    let needsRedraw = false;
    for (let i = 0; i < nIcons; i++) {
      let info = tbIconsInfo[i];
      let cmdId = info[0];
      let isEnabled = info[3];
      let isEnabledNew = isMenuEnabled(cmdId);
      if (isEnabled !== isEnabledNew) {
        needsRedraw = true;
        info[3] = isEnabledNew;
      }
    }
    // console.log("setToolbarEnabledState: needsRedraw:", needsRedraw);
    if (needsRedraw) {
      redrawToolbar();
    }
  }

  $: redrawToolbar(wordWrap);

  // Notepad2.c. DefaultToolbarButtons
  let toolbarButtonsOrder = [
    22, 3, 0, 1, 2, 0, 4, 18, 19, 0, 5, 6, 0, 7, 8, 9, 20, 0, 10, 11, 0, 12, 0,
    24, 0, 15,
  ];

  function redrawToolbar(ignore) {
    toolbarButtonsOrder = toolbarButtonsOrder;
  }

  // order of icons in toolbar bitmap
  // el[0] is id of the command sent by the icon
  // el[1] is tooltip for this icon
  // el[2] is dataURL for Image() for this icon
  // el[3] is enabled (if true)
  /** @type {[string, string, string, boolean][]}*/
  let tbIconsInfo = [
    [IDT_FILE_NEW, "New", "", true],
    [IDT_FILE_OPEN, "Open", "", true],
    [IDT_FILE_BROWSE, "Browse", "", true],
    [IDT_FILE_SAVE, "Save", "", true],
    [IDT_EDIT_UNDO, "Undo", "", true],
    [IDT_EDIT_REDO, "Redo", "", true],
    [IDT_EDIT_CUT, "Cut", "", true],
    [IDT_EDIT_COPY, "Copy", "", true],
    [IDT_EDIT_PASTE, "Paste", "", true],
    [IDT_EDIT_FIND, "Find", "", true],
    [IDT_EDIT_REPLACE, "Replace", "", true],
    [IDT_VIEW_WORDWRAP, "Word Wrap", "", true],
    [IDT_VIEW_ZOOMIN, "Zoom In", "", true],
    [IDT_VIEW_ZOOMOUT, "Zoom Out", "", true],
    [IDT_VIEW_SCHEME, "Select Scheme", "", true],
    [IDT_VIEW_SCHEMECONFIG, "Customize Schemes", "", true],
    [IDT_FILE_EXIT, "Exit", "", true],
    [IDT_FILE_SAVEAS, "Save As", "", true],
    [IDT_FILE_SAVECOPY, "Save Copy", "", true],
    [IDT_EDIT_DELETE, "Delete", "", true],
    [IDT_FILE_PRINT, "Print", "", true],
    [IDM_FILE_OPENFAV, "Favorites", "", true],
    [IDT_FILE_ADDTOFAV, "Add to Favorites", "", true],
    [IDT_VIEW_TOGGLEFOLDS, "Toggle Folds", "", true],
    [IDT_FILE_LAUNCH, "Execute Document]", "", true],
    [IDT_VIEW_ALWAYSONTOP, "Always On Top", "", true],
  ];
  const nIcons = len(tbIconsInfo);
  let iconDy = 24;
  let iconDx = iconDy;

  function buildIconImages() {
    let uriBmp = "";
    switch (iconDy) {
      case 16:
        uriBmp = "Toolbar16.bmp";
        break;
      case 24:
        uriBmp = "Toolbar24.bmp";
        // uriBmp = "Toolbar24.png";
        break;
      default:
        throwIf(true, `unsupported iconDy of ${iconDy}`);
    }

    // console.log("uriBmp:", uriBmp);
    let img = new Image();
    img.onload = () => {
      let canvasTmp = document.createElement("canvas");
      // canvasTmp.setAttribute("willReadFrequently", "true");
      canvasTmp.width = iconDx;
      canvasTmp.height = iconDy;
      const dw = iconDx;
      const dh = iconDy;
      const sw = iconDx;
      const sh = iconDy;
      const sy = 0;
      const nPixels = iconDx * iconDy;
      for (let i = 0; i < nIcons; i++) {
        let ctx = canvasTmp.getContext("2d", { willReadFrequently: true });
        let sx = i * iconDx;
        ctx.clearRect(0, 0, dw, dh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
        let imgd = ctx.getImageData(0, 0, iconDy, iconDy);
        let pix = imgd.data;
        function makePixTransparent(n) {
          let i = n * 4;
          let v = pix[i] + pix[i + 1] + pix[i + 2];
          if (v === 0) {
            pix[i + 3] = 0;
          }
        }
        for (let i = 0; i < nPixels; i++) {
          makePixTransparent(i);
        }
        ctx.putImageData(imgd, 0, 0);
        let dataURL = canvasTmp.toDataURL("image/png");
        tbIconsInfo[i][2] = dataURL;
      }
      isToolbarReady = true;
      setToolbarEnabledState();
    };
    img.src = uriBmp;
  }

  export const funcs = {
    setToolbarEnabledState: setToolbarEnabledState,
  };

  function hilightClass(info) {
    const cmdId = info[0];
    switch (cmdId) {
      case IDT_VIEW_WORDWRAP:
        return wordWrap ? "bg-blue-50" : "bg-white";
      default:
        return "bg-white";
    }
  }
  onMount(() => {
    buildIconImages();
  });
</script>

{#if show && isToolbarReady}
  <div class="flex pl-1">
    {#each toolbarButtonsOrder as idx}
      {#if idx === 0}
        <div class="w-[4px]"></div>
      {:else}
        {@const info = tbIconsInfo[idx - 1]}
        {@const cmdId = info[0]}
        {@const txt = info[1]}
        {@const dataURL = info[2]}
        {@const disabled = !info[3]}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <img
          src={dataURL}
          alt={txt}
          use:tooltip={txt}
          width={iconDx}
          height={iconDy}
          class:disabled
          class="{hilightClass(info)} mt-1 px-1 py-1 hover:bg-blue-100"
          on:click={() => handleMenuCmd({ detail: { cmd: cmdId } })}
        />
      {/if}
    {/each}
  </div>
{:else}
  <div class="w-0 h-0"></div>
{/if}
