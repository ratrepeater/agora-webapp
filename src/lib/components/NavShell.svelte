<script lang="ts">
    import { goto, invalidateAll } from '$app/navigation';
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

    // Handle sign out
    async function handleSignOut() {
        try {
            // Use FormData for proper form submission
            const formData = new FormData();
            const response = await fetch('/auth/signout', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                // Invalidate all data and redirect
                await invalidateAll();
                goto('/');
            } else {
                // Fallback: just navigate to sign-out page
                goto('/auth/signout');
            }
        } catch (error) {
            console.error('Sign out error:', error);
            // Fallback: just navigate to sign-out page
            goto('/auth/signout');
        }
    }

    let searchQuery = $state('');
    let selectedCategory = $state('All');

    const categories = ['All', 'HR', 'Legal', 'Marketing', 'DevTools'];
    const categoryKeys: Record<string, string> = {
        'All': 'All',
        'HR': 'hr',
        'Legal': 'legal',
        'Marketing': 'marketing',
        'DevTools': 'devtools'
    };

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
        const params = new URLSearchParams();
        
        if (searchQuery.trim()) {
            params.set('q', searchQuery);
        }
        
        if (selectedCategory !== 'All') {
            params.set('category', categoryKeys[selectedCategory]);
        }
        
        const queryString = params.toString();
        goto(`/marketplace${queryString ? '?' + queryString : ''}`);
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
                <label for="my-drawer-2" aria-label="Open navigation menu" class="btn btn-square btn-ghost">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        class="inline-block h-6 w-6 stroke-current"
                        aria-hidden="true"
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
                <a href="/" class="btn btn-ghost text-xl mr-3" aria-label="AGORA Home">
                    <img src={favicon} alt="" class="h-8 w-8" aria-hidden="true" />
                    AGORA
                </a>
            </div>

            <!-- Search bar (desktop only) -->
            <div class="grow-5 ml-10 mr-10 hidden lg:inline-flex" role="search">
                <div class="join w-full">
                    <label class="input w-full join-item">
                        <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
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
                            placeholder="Search services by name, category, or industry"
                            aria-label="Search products"
                            bind:value={searchQuery}
                            onkeypress={handleSearchKeypress}
                        />
                    </label>
                    <select 
                        class="select join-item w-30" 
                        bind:value={selectedCategory}
                        aria-label="Filter by category"
                    >
                        {#each categories as category}
                            <option value={category}>{category}</option>
                        {/each}
                    </select>
                    <button class="btn btn-primary join-item" onclick={handleSearch} aria-label="Search">Browse</button>
                </div>
            </div>

            <!-- Desktop navigation links -->
            <div class="hidden lg:inline-flex justify-end gap-2 items-center">
                {#if user}
                    {#if userRole === 'buyer'}
                        <a href="/bookmarks" class="btn btn-ghost {isActive('/bookmarks') ? 'btn-active' : ''}">
                            Bookmarks
                        </a>
                        <a href="/compare" class="btn btn-ghost {isActive('/compare') ? 'btn-active' : ''}">
                            Compare
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
                    <a 
                        href="/cart" 
                        class="btn btn-ghost btn-circle {isActive('/cart') ? 'btn-active' : ''}"
                        aria-label="Shopping cart{cartItemCount > 0 ? `, ${cartItemCount} items` : ''}"
                    >
                        <div class="indicator">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {#if cartItemCount > 0}
                                <span class="badge badge-sm indicator-item" aria-hidden="true">{cartItemCount}</span>
                            {/if}
                        </div>
                    </a>
                {/if}

                <!-- User menu -->
                {#if user}
                    <div class="dropdown dropdown-end">
                        <div 
                            tabindex="0" 
                            role="button" 
                            class="btn btn-ghost btn-circle avatar"
                            aria-label="User menu"
                            aria-haspopup="true"
                        >
                            <div class="w-10 rounded-full bg-base-300 flex items-center justify-center">
                                <span class="text-lg font-semibold" aria-hidden="true">{user.email[0].toUpperCase()}</span>
                            </div>
                        </div>
                        <ul
                            tabindex="-1"
                            role="menu"
                            class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
                            aria-label="User menu options"
                        >
                            <li class="menu-title">
                                <span>{user.email}</span>
                            </li>
                            <li role="menuitem">
                                <button type="button" onclick={handleSignOut} class="w-full text-left">Sign Out</button>
                            </li>
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
            {#if user}
                {#if userRole === 'buyer'}
                    <li><a href="/bookmarks" class="{isActive('/bookmarks') ? 'active' : ''}">Bookmarks</a></li>
                    <li><a href="/compare" class="{isActive('/compare') ? 'active' : ''}">Compare</a></li>
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

                <li class="mt-4">
                    <button type="button" onclick={handleSignOut} class="w-full text-left">Sign Out</button>
                </li>
            {:else}
                <li><a href="/cart" class="{isActive('/cart') ? 'active' : ''}">
                    Cart {#if cartItemCount > 0}<span class="badge badge-sm">{cartItemCount}</span>{/if}
                </a></li>
                <li class="mt-4"><a href="/auth/signin" class="btn btn-primary">Sign In</a></li>
            {/if}
        </ul>
    </div>
</div>
