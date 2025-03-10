<script>
  /** @type {{size?: string, title?: any, [key: string]: any}} */
  let { size = "16", title = undefined, ...rest } = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 32 32"
  fill="currentColor"
  preserveAspectRatio="xMidYMid meet"
  width={size}
  height={size}
  {...rest}
>
  {#if title}<title>{title}</title>{/if}
  <path
    d="M16 4L6 14 7.41 15.41 15 7.83 15 28 17 28 17 7.83 24.59 15.41 26 14 16 4z"
  ></path>
</svg>
