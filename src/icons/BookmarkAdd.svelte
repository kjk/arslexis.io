<script lang="ts">
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
    d="M24,16V26.7515l-7.0962-3.5894L16,22.7051l-.9009.456L8,26.748V4H18V2H8A2,2,0,0,0,6,4V30l10-5.0537L26,30V16Z"
  ></path><path
    d="M26 6L26 2 24 2 24 6 20 6 20 8 24 8 24 12 26 12 26 8 30 8 30 6 26 6z"
  ></path>
</svg>
