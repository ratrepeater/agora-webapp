<script lang="ts">
    let { children } = $props();
</script>

<div class="container mx-auto m-7.5">
    {@render children?.()}
</div>