<script lang="ts">
    import { goto } from '$app/navigation';
    let { children, height } = $props();
</script>

<div style:height={height} style:width="100%" style:display="flex" style:justify-content="center" style:align-items="center">
    <div style:text-align="center">
        {@render children?.()}
    </div>
</div>