export * from "../common/deps.js";
export { Fragment, h, render as preactRender } from "preact";
export { useEffect, useReducer, useRef, useState } from "preact/hooks";
export {
  Book as BookIcon,
  Home as HomeIcon,
  Terminal as TerminalIcon,
} from "preact-feather";
export * as Y from "yjs";
export { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
export { WebsocketProvider } from "y-websocket";
export { getCM as vimGetCm, Vim, vim } from "@replit/codemirror-vim";
