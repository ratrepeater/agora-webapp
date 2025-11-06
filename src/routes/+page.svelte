<script lang="ts">
    import { goto } from '$app/navigation';
    import InfoSection from '$lib/components/InfoSection.svelte';
    import ListingCard from '$lib/components/ListingCard.svelte';
	import { onMount } from 'svelte';
    import type { ListingInfo } from '$lib/helpers/types';


    let listings : ListingInfo[] = $state([]);

    onMount(() => {
        // TODO: abstract away API calls
        fetch('/api/listings')
            .then(res => res.json())
            .then(data => {
                listings = data;
            });
    });
</script>

<InfoSection class="whitespace-nowrap overflow-x-scroll">
    {#each listings as data}
        <ListingCard data={data} />
    {/each}
</InfoSection>