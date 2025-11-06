<script lang="ts">
	import { onMount } from "svelte";
    import type { ListingInfo } from "$lib/helpers/types";
    
    let { data }: { data: ListingInfo } = $props();

    let isNew = $state(false);

    onMount(() => {
        let created_at = new Date(data.created_at);
        let now = new Date();
        isNew = now.getTime() - created_at.getTime() < 1000 * 60 * 60 * 24 * 7;
    })
</script>

<div class="indicator">
    {#if isNew}
        <span class="indicator-item badge badge-success">New</span>
    {/if}
    <div class="card bg-base-100 card-border shadow-md w-96">
        <div class="card-body">
            <h2 class="card-title">{data.title}</h2>
            <p>{data.description}</p>

            <div class="overflow-x-scroll whitespace-nowrap pb-2 pt-2">
                {#each data.tags as tag}
                    <span class="badge badge-ghost inline-block mr-2">{tag}</span>
                {/each}
            </div>
            <div class="divider mt-1 mb-1"></div>
            <div class="w-full flex flex-row justify-between">
                <button class="btn btn-outline grow basis-0 mr-2">Compare</button>
                <button class="btn btn-outline grow basis-0">Save</button>
            </div>
        </div>
    </div>
</div>