<script lang="ts">
    import { goto } from '$app/navigation';
    let { children } = $props();
</script>

<div class="info-section">
    {@render children?.()}
</div>

<style>
    .info-section {
        width: 100%;
        box-sizing: border-box;
        padding: 50px 200px;
    }
</style>