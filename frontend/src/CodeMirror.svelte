<script>
  //based on https://github.com/touchifyapp/svelte-codemirror-editor/blob/main/src/lib/CodeMirror.svelte
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { basicSetup } from "codemirror";
  import {
    EditorView,
    keymap,
    placeholder as placeholderExt,
  } from "@codemirror/view";
  import { EditorState, StateEffect } from "@codemirror/state";
  import { indentWithTab } from "@codemirror/commands";
  import { indentUnit } from "@codemirror/language";
  import { debounce } from "./util.js";

  let classes = "";
  export { classes as class };
  export let value = "";

  export let basic = true;
  export let lang = undefined;
  export let theme = undefined;
  export let extensions = [];

  export let useTab = true;
  export let tabSize = 2;

  export let styles = undefined;
  export let lineWrapping = false;
  export let editable = true;
  export let readonly = false;
  export let placeholder = undefined;

  const dispatch = createEventDispatcher();

  let element;
  let view;

  let update_from_prop = false;
  let update_from_state = false;
  let first_config = true;
  let first_update = true;

  $: state_extensions = [
    ...get_base_extensions(
      basic,
      useTab,
      tabSize,
      lineWrapping,
      placeholder,
      editable,
      readonly,
      lang
    ),
    ...get_theme(theme, styles),
    ...extensions,
  ];

  $: view && update(value);
  $: view && state_extensions && reconfigure();

  onMount(() => (view = create_editor_view()));
  onDestroy(() => view?.destroy());

  function create_editor_view() {
    const on_change = debounce(handle_change, 300);

    return new EditorView({
      parent: element,
      state: create_editor_state(value),
      dispatch(transaction) {
        view.update([transaction]);

        if (!update_from_prop && transaction.docChanged) {
          on_change();
        }
      },
    });
  }

  function reconfigure() {
    if (first_config) {
      first_config = false;
      return;
    }

    view.dispatch({
      effects: StateEffect.reconfigure.of(state_extensions),
    });
  }

  function update(value) {
    if (first_update) {
      first_update = false;
      return;
    }

    if (update_from_state) {
      update_from_state = false;
      return;
    }

    update_from_prop = true;

    view.setState(create_editor_state(value));

    update_from_prop = false;
  }

  function handle_change() {
    const new_value = view.state.doc.toString();
    if (new_value === value) return;

    update_from_state = true;

    value = new_value;
    dispatch("change", value);
  }

  function create_editor_state(value) {
    return EditorState.create({
      doc: value ?? undefined,
      extensions: state_extensions,
    });
  }

  function get_base_extensions(
    basic,
    useTab,
    tabSize,
    lineWrapping,
    placeholder,
    editable,
    readonly,
    lang
  ) {
    const extensions = [
      indentUnit.of(" ".repeat(tabSize)),
      EditorView.editable.of(editable),
      EditorState.readOnly.of(readonly),
    ];

    if (basic) extensions.push(basicSetup);
    if (useTab) extensions.push(keymap.of([indentWithTab]));
    if (placeholder) extensions.push(placeholderExt(placeholder));
    if (lang) extensions.push(lang);
    if (lineWrapping) extensions.push(EditorView.lineWrapping);

    return extensions;
  }

  function get_theme(theme, styles) {
    const extensions = [];
    if (styles) extensions.push(EditorView.theme(styles));
    if (theme) extensions.push(theme);
    return extensions;
  }
</script>

<div class="codemirror-wrapper {classes}" bind:this={element} />

<style>
  .codemirror-wrapper :global(.cm-focused) {
    outline: none;
  }
</style>
