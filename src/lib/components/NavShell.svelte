<script>
    import { goto } from '$app/navigation';
    import favicon from '$lib/assets/favicon.svg';

    let { children } = $props();
</script>

<div class="drawer">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
        <!-- Navbar -->
        <div class="navbar bg-base-300/50 backdrop-blur-md shadow-md sticky top-0 z-40 w-full">
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
            <div class="inline-flex justify-start">
                <a href="/" class="btn btn-ghost text-xl mr-3">
                    <img src={favicon} alt="AGORA" class="h-8 w-8" />
                    AGORA
                </a>
                <details class="dropdown hidden lg:block">
                    <summary class="btn btn-ghost">Departments</summary>
                    <ul class="menu xl:menu-horizontal bg-base-200 rounded-box lg:min-w-max fixed shadow-sm">
                        <li>
                            <a>Industries</a>
                            <ul>
                            <li><a>Design</a></li>
                            <li><a>Development</a></li>
                            <li><a>Hosting</a></li>
                            <li><a>Domain register</a></li>
                            </ul>
                        </li>
                        <li>
                            <a>Categories</a>
                            <ul>
                            <li><a>CRM software</a></li>
                            <li><a>Marketing management</a></li>
                            <li><a>Security</a></li>
                            <li><a>Consulting</a></li>
                            </ul>
                        </li>
                    </ul>
                </details>
            </div>
            <div class="grow-5 ml-5 mr-5 hidden lg:inline-flex">
                <label class="input w-full">
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
                    <input type="search" class="grow" placeholder="Search software by name, category, or industry" />
                </label>
            </div>
            <div class="hidden lg:inline-flex justify-end">
                <button class="btn btn-ghost">
                    Request Invite
                </button>
                <button class="btn ml-3">
                    List Your Business
                </button>
                <button class="btn btn-primary ml-3">
                    Investor Portal
                </button>
            </div>
        </div>
        <!-- Page content here -->
        {@render children?.()}
    </div>
    <div class="drawer-side z-50">
        <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu bg-base-200 min-h-full w-80 p-4">
            <!-- Sidebar content here -->
            <li><a>Sidebar Item 1</a></li>
            <li><a>Sidebar Item 2</a></li>
        </ul>
    </div>
</div>
