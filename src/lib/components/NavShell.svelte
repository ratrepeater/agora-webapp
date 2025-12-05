<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import favicon from '$lib/assets/favicon.svg';
    import type { UserRole } from '$lib/helpers/types';

    interface Props {
        children?: import('svelte').Snippet;
        user?: { id: string; email: string } | null;
        userRole?: UserRole | null;
        cartItemCount?: number;
    }

    let { children, user = null, userRole = null, cartItemCount = 0 }: Props = $props();

    let searchQuery = $state('');
    let selectedCategory = $state('All');

    const categories = ['All', 'HR', 'Law', 'Office', 'DevTools'];

    // Determine current path for active state highlighting
    let currentPath = $derived($page.url.pathname);

    // Check if a link is active
    function isActive(path: string): boolean {
        if (path === '/') {
            return currentPath === '/';
        }
        return currentPath.startsWith(path);
    }

    // Handle search submission
    function handleSearch() {
        if (searchQuery.trim()) {
            const params = new URLSearchParams();
            params.set('q', searchQuery);
            if (selectedCategory !== 'All') {
                params.set('category', selectedCategory);
            }
            goto(`/marketplace?${params.toString()}`);
        } else {
            goto('/marketplace');
        }
    }

    // Handle search input keypress
    function handleSearchKeypress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }
</script>

<div class="drawer">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
        <!-- Navbar -->
        <div class="navbar bg-base-300/50 backdrop-blur-md shadow-md sticky top-0 z-40 w-full">
            <!-- Mobile menu button -->
            <div class="flex-none lg:hidden">
                <label for="my-drawer-2" aria-label="open sidebar" class="btn btn-square btn-ghost">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        class="inline-block h-6 w-6 stroke-current"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16"
                        ></path>
                    </svg>
                </label>
            </div>

            <!-- Logo -->
            <div class="inline-flex justify-start">
                <a href="/" class="btn btn-ghost text-xl mr-3">
                    <img src={favicon} alt="AGORA" class="h-8 w-8" />
                    AGORA
                </a>
            </div>

            <!-- Search bar (desktop only) -->
            <div class="grow-5 ml-10 mr-10 hidden lg:inline-flex">
                <div class="join w-full">
                    <label class="input w-full join-item">
                        <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <g
                                stroke-linejoin="round"
                                stroke-linecap="round"
                                stroke-width="2.5"
                                fill="none"
                                stroke="currentColor"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.3-4.3"></path>
                            </g>
                        </svg>
                        <input
                            type="search"
                            class="grow"
                            placeholder="Search software by name, category, or industry"
                            bind:value={searchQuery}
                            onkeypress={handleSearchKeypress}
                        />
                    </label>
                    <select class="select join-item w-30" bind:value={selectedCategory}>
                        {#each categories as category}
                            <option value={category}>{category}</option>
                        {/each}
                    </select>
                    <button class="btn join-item" onclick={handleSearch}>Search</button>
                </div>
            </div>

            <!-- Desktop navigation links -->
            <div class="hidden lg:inline-flex justify-end gap-2">
                <a href="/" class="btn btn-ghost {isActive('/') ? 'btn-active' : ''}">
                    Home
                </a>
                <a href="/marketplace" class="btn btn-ghost {isActive('/marketplace') ? 'btn-active' : ''}">
                    Marketplace
                </a>

                {#if user}
                    {#if userRole === 'buyer'}
                        <a href="/bookmarks" class="btn btn-ghost {isActive('/bookmarks') ? 'btn-active' : ''}">
                            Bookmarks
                        </a>
                        <a href="/orders" class="btn btn-ghost {isActive('/orders') ? 'btn-active' : ''}">
                            Orders
                        </a>
                        <a href="/dashboard" class="btn btn-ghost {isActive('/dashboard') ? 'btn-active' : ''}">
                            Dashboard
                        </a>
                    {:else if userRole === 'seller'}
                        <a href="/seller/dashboard" class="btn btn-ghost {isActive('/seller/dashboard') ? 'btn-active' : ''}">
                            Dashboard
                        </a>
                        <a href="/seller/products" class="btn btn-ghost {isActive('/seller/products') ? 'btn-active' : ''}">
                            My Products
                        </a>
                        <a href="/seller/competitors" class="btn btn-ghost {isActive('/seller/competitors') ? 'btn-active' : ''}">
                            Competitors
                        </a>
                    {/if}
                {/if}

                <!-- Cart button (buyers only) -->
                {#if !userRole || userRole === 'buyer'}
                    <a href="/cart" class="btn btn-ghost btn-circle {isActive('/cart') ? 'btn-active' : ''}">
                        <div class="indicator">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {#if cartItemCount > 0}
                                <span class="badge badge-sm indicator-item">{cartItemCount}</span>
                            {/if}
                        </div>
                    </a>
                {/if}

                <!-- User menu -->
                {#if user}
                    <div class="dropdown dropdown-end">
                        <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
                            <div class="w-10 rounded-full bg-base-300 flex items-center justify-center">
                                <span class="text-lg font-semibold">{user.email[0].toUpperCase()}</span>
                            </div>
                        </div>
                        <ul
                            tabindex="-1"
                            class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
                        >
                            <li class="menu-title">
                                <span>{user.email}</span>
                            </li>
                            <li><a href="/auth/signout">Sign Out</a></li>
                        </ul>
                    </div>
                {:else}
                    <a href="/auth/signin" class="btn btn-primary">Sign In</a>
                {/if}
            </div>
        </div>

        <!-- Page content here -->
        {@render children?.()}
    </div>

    <!-- Mobile drawer sidebar -->
    <div class="drawer-side z-50">
        <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu bg-base-200 min-h-full w-80 p-4">
            <!-- Mobile search -->
            <li class="mb-4">
                <div class="form-control">
                    <input
                        type="search"
                        placeholder="Search..."
                        class="input input-bordered w-full"
                        bind:value={searchQuery}
                        onkeypress={handleSearchKeypress}
                    />
                </div>
            </li>

            <!-- Navigation links -->
            <li><a href="/" class="{isActive('/') ? 'active' : ''}">Home</a></li>
            <li><a href="/marketplace" class="{isActive('/marketplace') ? 'active' : ''}">Marketplace</a></li>

            {#if user}
                {#if userRole === 'buyer'}
                    <li><a href="/bookmarks" class="{isActive('/bookmarks') ? 'active' : ''}">Bookmarks</a></li>
                    <li><a href="/orders" class="{isActive('/orders') ? 'active' : ''}">Orders</a></li>
                    <li><a href="/cart" class="{isActive('/cart') ? 'active' : ''}">
                        Cart {#if cartItemCount > 0}<span class="badge badge-sm">{cartItemCount}</span>{/if}
                    </a></li>
                    <li><a href="/dashboard" class="{isActive('/dashboard') ? 'active' : ''}">Dashboard</a></li>
                {:else if userRole === 'seller'}
                    <li><a href="/seller/dashboard" class="{isActive('/seller/dashboard') ? 'active' : ''}">Dashboard</a></li>
                    <li><a href="/seller/products" class="{isActive('/seller/products') ? 'active' : ''}">My Products</a></li>
                    <li><a href="/seller/competitors" class="{isActive('/seller/competitors') ? 'active' : ''}">Competitors</a></li>
                {/if}

                <li class="mt-4"><a href="/auth/signout">Sign Out</a></li>
            {:else}
                <li><a href="/cart" class="{isActive('/cart') ? 'active' : ''}">
                    Cart {#if cartItemCount > 0}<span class="badge badge-sm">{cartItemCount}</span>{/if}
                </a></li>
                <li class="mt-4"><a href="/auth/signin" class="btn btn-primary">Sign In</a></li>
            {/if}
        </ul>
    </div>
</div>
