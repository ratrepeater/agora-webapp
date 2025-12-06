<script lang="ts">
	import type { ReviewWithBuyer } from '$lib/helpers/types';

	interface Props {
		reviews: ReviewWithBuyer[];
		averageRating: number;
		canReview?: boolean;
		onsubmitreview?: (reviewData: { rating: number; title: string; body: string }) => void;
	}

	let { reviews, averageRating, canReview = false, onsubmitreview }: Props = $props();

	import { validateReviewForm } from '$lib/helpers/validation';

	// Review form state
	let showReviewForm = $state(false);
	let reviewRating = $state(5);
	let reviewTitle = $state('');
	let reviewBody = $state('');
	let isSubmitting = $state(false);
	let reviewErrors: Record<string, string> = $state({});
	let showReviewValidation = $state(false);

	function validateReview(): boolean {
		const validation = validateReviewForm({
			rating: reviewRating,
			title: reviewTitle,
			body: reviewBody
		});
		reviewErrors = validation.errors;
		return validation.isValid;
	}

	function handleSubmitReview() {
		showReviewValidation = true;
		
		if (!validateReview()) {
			return;
		}

		isSubmitting = true;
		onsubmitreview?.({
			rating: reviewRating,
			title: reviewTitle,
			body: reviewBody
		});

		// Reset form
		reviewRating = 5;
		reviewTitle = '';
		reviewBody = '';
		showReviewForm = false;
		showReviewValidation = false;
		reviewErrors = {};
		isSubmitting = false;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function renderStars(rating: number): string {
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 >= 0.5;
		const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

		return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(emptyStars);
	}
</script>

<div class="w-full">
	<!-- Reviews Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h2 class="text-2xl font-bold mb-2">Customer Reviews</h2>
			{#if reviews.length > 0}
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-2">
						<span class="text-3xl font-bold text-primary">{averageRating.toFixed(1)}</span>
						<div class="flex flex-col">
							<div class="text-xl text-warning" aria-label="Rating: {averageRating} out of 5 stars">
								{renderStars(averageRating)}
							</div>
							<span class="text-sm text-base-content/70">
								Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
							</span>
						</div>
					</div>
				</div>
			{/if}
		</div>

		{#if canReview && !showReviewForm}
			<button class="btn btn-primary" onclick={() => (showReviewForm = true)}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				</svg>
				Write a Review
			</button>
		{/if}
	</div>

	<!-- Review Submission Form -->
	{#if showReviewForm}
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h3 class="text-xl font-bold mb-4">Write Your Review</h3>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmitReview();
					}}
				>
					<!-- Rating Input -->
					<div class="form-control mb-4">
						<label class="label" for="review-rating">
							<span class="label-text font-medium">Rating</span>
						</label>
						<div class="flex items-center gap-2">
							<input
								id="review-rating"
								type="range"
								min="1"
								max="5"
								bind:value={reviewRating}
								class="range range-primary"
								step="1"
							/>
							<span class="text-2xl text-warning w-32">
								{renderStars(reviewRating)}
							</span>
							<span class="text-lg font-bold">{reviewRating}/5</span>
						</div>
					</div>

					<!-- Title Input -->
					<div class="form-control mb-4">
						<label class="label" for="review-title">
							<span class="label-text font-medium">Review Title (Optional)</span>
						</label>
						<input
							id="review-title"
							type="text"
							bind:value={reviewTitle}
							oninput={() => showReviewValidation && validateReview()}
							placeholder="Summarize your experience"
							class="input input-bordered"
							class:input-error={showReviewValidation && reviewErrors.title}
							maxlength="100"
						/>
						{#if showReviewValidation && reviewErrors.title}
							<label class="label">
								<span class="label-text-alt text-error">{reviewErrors.title}</span>
							</label>
						{/if}
					</div>

					<!-- Body Input -->
					<div class="form-control mb-4">
						<label class="label" for="review-body">
							<span class="label-text font-medium">Your Review (Optional)</span>
						</label>
						<textarea
							id="review-body"
							bind:value={reviewBody}
							oninput={() => showReviewValidation && validateReview()}
							placeholder="Share your thoughts about this product..."
							class="textarea textarea-bordered h-32"
							class:textarea-error={showReviewValidation && reviewErrors.body}
							maxlength="1000"
						></textarea>
						<label class="label">
							<span class="label-text-alt text-base-content/60">
								{reviewBody.length}/1000 characters
							</span>
						</label>
						{#if showReviewValidation && reviewErrors.body}
							<label class="label">
								<span class="label-text-alt text-error">{reviewErrors.body}</span>
							</label>
						{/if}
					</div>

					<!-- Form Actions -->
					<div class="flex gap-2 justify-end">
						<button
							type="button"
							class="btn btn-ghost"
							onclick={() => (showReviewForm = false)}
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
							{#if isSubmitting}
								<span class="loading loading-spinner loading-sm"></span>
								Submitting...
							{:else}
								Submit Review
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Reviews List -->
	{#if reviews.length === 0}
		<!-- Empty State -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body items-center text-center py-16">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-24 w-24 text-base-content/30 mb-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
					/>
				</svg>
				<h3 class="text-2xl font-bold mb-2">No reviews yet</h3>
				<p class="text-base-content/70 mb-6">Be the first to share your experience with this product</p>
				{#if canReview && !showReviewForm}
					<button class="btn btn-primary" onclick={() => (showReviewForm = true)}>
						Write the First Review
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Review Cards -->
		<div class="space-y-4">
			{#each reviews as review (review.id)}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<!-- Review Header -->
						<div class="flex items-start justify-between mb-3">
							<div class="flex items-center gap-3">
								<!-- Reviewer Avatar -->
								<div class="avatar placeholder">
									<div class="bg-primary text-primary-content rounded-full w-12">
										<span class="text-xl">
											{review.buyer.full_name
												? review.buyer.full_name.charAt(0).toUpperCase()
												: review.buyer.email.charAt(0).toUpperCase()}
										</span>
									</div>
								</div>

								<!-- Reviewer Info -->
								<div>
									<h4 class="font-bold">
										{review.buyer.full_name || review.buyer.email.split('@')[0]}
									</h4>
									<div class="flex items-center gap-2">
										<span class="text-warning text-lg" aria-label="Rating: {review.rating} out of 5 stars">
											{renderStars(review.rating)}
										</span>
										<span class="text-sm text-base-content/60">
											{formatDate(review.created_at)}
										</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Review Title -->
						{#if review.title}
							<h5 class="text-lg font-semibold mb-2">{review.title}</h5>
						{/if}

						<!-- Review Body -->
						{#if review.body}
							<p class="text-base-content/80 whitespace-pre-wrap">{review.body}</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
