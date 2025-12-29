<script lang="ts">
    import { page } from '$app/stores';

    // Get error details
    let status = $derived($page.status);
    let message = $derived($page.error?.message || 'An unexpected error occurred');

    // Get error title based on status code
    function getErrorTitle(status: number): string {
        switch (status) {
            case 404:
                return 'Page Not Found';
            case 403:
                return 'Access Denied';
            case 401:
                return 'Unauthorized';
            case 500:
                return 'Server Error';
            case 503:
                return 'Service Unavailable';
            default:
                return 'Error';
        }
    }

    // Get error description based on status code
    function getErrorDescription(status: number): string {
        switch (status) {
            case 404:
                return "The page you're looking for doesn't exist or has been moved.";
            case 403:
                return "You don't have permission to access this resource.";
            case 401:
                return 'Please sign in to access this page.';
            case 500:
                return 'Something went wrong on our end. Please try again later.';
            case 503:
                return 'The service is temporarily unavailable. Please try again in a few moments.';
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }

    // Get icon for error type
    function getErrorIcon(status: number): string {
        if (status === 404) {
            return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';
        } else if (status === 403 || status === 401) {
            return 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';
        } else {
            return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
        }
    }
</script>

<svelte:head>
    <title>{status} - {getErrorTitle(status)}</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-base-200 px-4">
    <div class="max-w-2xl w-full">
        <div class="card bg-base-100 shadow-2xl">
            <div class="card-body items-center text-center py-16">
                <!-- Error Icon -->
                <div class="mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-24 w-24 text-error"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d={getErrorIcon(status)}
                        />
                    </svg>
                </div>

                <!-- Error Status -->
                <div class="text-6xl font-bold text-error mb-4">{status}</div>

                <!-- Error Title -->
                <h1 class="text-3xl font-bold mb-4">{getErrorTitle(status)}</h1>

                <!-- Error Description -->
                <p class="text-lg text-base-content/70 mb-2">{getErrorDescription(status)}</p>

                <!-- Error Message (if available and not default) -->
                {#if message && message !== 'Not Found' && message !== getErrorDescription(status)}
                    <div class="alert alert-error max-w-md mt-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="stroke-current shrink-0 h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span class="text-sm">{message}</span>
                    </div>
                {/if}

                <!-- Action Buttons -->
                <div class="flex gap-4 mt-8">
                    <button class="btn btn-ghost" onclick={() => window.history.back()}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Go Back
                    </button>

                    <a href="/" class="btn btn-primary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        Go Home
                    </a>
                </div>

                <!-- Support Information -->
                {#if status >= 500}
                    <div class="mt-8 text-sm text-base-content/60">
                        <p>If this problem persists, please contact support.</p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
