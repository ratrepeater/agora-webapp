<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData } from './$types';

    let { form }: { form: ActionData } = $props();

    let error = $derived(form?.error || '');
    let success = $derived(form?.success || false);

    let location = $derived(typeof window !== 'undefined' ? window.location : null);
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-96 bg-base-100 shadow-xl">
        <div class="card-body">
            <h2 class="card-title text-2xl font-bold mb-4">Forgot Password</h2>
            {#if error}
                <div class="alert alert-error mb-4">
                    <span>{error}</span>
                </div>
            {/if}

            <form method="POST" use:enhance>
                <div class="form-control mb-4">
                    <label class="label" for="email">
                        <span class="label-text">Email</span>
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="email@example.com"
                        class="input input-bordered"
                        required
                    />
                </div>

                <input type="hidden" name="redirectTo" value="{location ? location.origin : ''}/auth/callback?redirectTo={encodeURIComponent('/auth/reset-password')}" />

                <div class="form-control">
                    <button type="submit" class="btn btn-primary">
                        Reset Password
                    </button>
                </div>
            </form>

            {#if success}
                <div class="alert alert-success mb-4">
                    <span>Password reset email sent!</span>
                </div>
            {/if}
        </div>
    </div>
</div>
