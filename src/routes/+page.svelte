<script lang="ts">
    import { goto } from '$app/navigation';
    import InfoSection from '$lib/components/InfoSection.svelte';
    import ListingCard from '$lib/components/ListingCard.svelte';
</script>

<InfoSection>
    <ListingCard data={{
        uid: "123",
        created_at: "2023-07-01T00:00:00.000Z",
        creator_id: "123",
        title: "Agora",
        description: "Agora is a decentralized platform for software developers to build and monetize their own software products.",
        tags: ["Agora", "Decentralized", "Software", "Developer", "Product", "Monetization"],
        public: true
    }}/>
</InfoSection>