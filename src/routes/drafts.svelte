<script lang="ts">
  import DraftList from '../components/DraftList.svelte';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();
</script>

{#if open}
  <button class="draft-backdrop" type="button" aria-label="Close drafts" onclick={onclose}></button>
{/if}

<aside class:open class="draft-panel" aria-label="Drafts panel">
  <DraftList onclose={onclose} />
</aside>
