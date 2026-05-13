<script lang="ts">
  export let open = false;
</script>

{#if open}
  <div class="command-palette" role="dialog" aria-label="Command palette">
    <input type="search" placeholder="Command" />
  </div>
{/if}
