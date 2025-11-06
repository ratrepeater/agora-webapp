<script lang="ts">
    let { children, class: className = "" } = $props();
</script>

<div class="container mx-auto m-7.5 {className}">
    {@render children?.()}
</div>