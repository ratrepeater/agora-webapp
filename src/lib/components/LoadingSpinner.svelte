<script lang="ts">
    interface Props {
        size?: 'sm' | 'md' | 'lg' | 'xl';
        text?: string;
        fullScreen?: boolean;
    }

    let { size = 'md', text, fullScreen = false }: Props = $props();

    // Get spinner size class
    function getSizeClass(size: string): string {
        switch (size) {
            case 'sm':
                return 'loading-sm';
            case 'md':
                return 'loading-md';
            case 'lg':
                return 'loading-lg';
            case 'xl':
                return 'loading-xl';
            default:
                return 'loading-md';
        }
    }
</script>

{#if fullScreen}
    <div class="fixed inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner {getSizeClass(size)} text-primary"></span>
            {#if text}
                <p class="text-lg font-medium">{text}</p>
            {/if}
        </div>
    </div>
{:else}
    <div class="flex flex-col items-center justify-center gap-4 py-8">
        <span class="loading loading-spinner {getSizeClass(size)} text-primary"></span>
        {#if text}
            <p class="text-base font-medium text-base-content/70">{text}</p>
        {/if}
    </div>
{/if}

