<template>
	<div class="space-y-6">
		<div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
			<h3 class="text-lg font-bold text-brand-dark mt-0 mb-1">Booking Dashboard</h3>
			<p class="text-xs text-gray-500 mb-4">Choose an accommodation and register your stay request.</p>

			<div v-if="loadingAccommodations" class="text-sm text-gray-500">Loading accommodations...</div>

			<div v-else-if="availableAccommodations.length === 0" class="p-4 rounded-xl border border-dashed border-amber-200 bg-amber-50 text-amber-800 text-sm">
				No approved accommodations are available right now.
			</div>

			<form v-else @submit.prevent="submitBooking" class="space-y-4">
				<div>
					<label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Accommodation</label>
					<select v-model="bookingForm.accommodation_id" class="choco-input text-sm" required>
						<option disabled value="">Select an accommodation</option>
						<option v-for="item in availableAccommodations" :key="item.id" :value="String(item.id)">
							{{ item.title }} - {{ item.location || 'No location' }} - {{ formatPrice(item.price_per_night) }} / night
						</option>
					</select>
				</div>

				<div v-if="selectedAccommodation" class="p-4 rounded-xl border border-green-100 bg-brand-bg/60 space-y-2 text-sm">
					<p class="font-bold text-brand-dark">Selected Accommodation</p>
					<p><span class="font-semibold">Name:</span> {{ selectedAccommodation.title }}</p>
					<p><span class="font-semibold">Type:</span> {{ selectedAccommodation.accommodation_type || 'Not specified' }} / {{ selectedAccommodation.bed_type || 'Not specified' }}</p>
					<p><span class="font-semibold">Location:</span> {{ selectedAccommodation.location || 'Not provided' }}</p>
					<p><span class="font-semibold">Price:</span> {{ formatPrice(selectedAccommodation.price_per_night) }} / night</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Check-In Date</label>
						<input v-model="bookingForm.check_in_date" type="date" :min="today" class="choco-input text-sm" required />
					</div>
					<div>
						<label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Check-Out Date</label>
						<input v-model="bookingForm.check_out_date" type="date" :min="bookingForm.check_in_date || today" class="choco-input text-sm" required />
					</div>
				</div>
            <!--
				<div>
					<label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Booking Status</label>
					<select v-model="bookingForm.status" class="choco-input text-sm" required>
						<option value="pending">Pending</option>
						<option value="confirmed">Confirmed</option>
						<option value="cancelled">Cancelled</option>
					</select>
				</div>
            -->
				<button type="submit" :disabled="submitting" class="choco-btn-primary text-xs uppercase tracking-wider py-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
					{{ submitting ? 'Saving Booking...' : 'Save Booking' }}
				</button>
			</form>

			<p v-if="bookingAlert" :class="['mt-4 text-xs font-semibold p-2.5 rounded-lg text-center border', bookingAlertIsError ? 'bg-red-50 text-red-700 border-red-100' : 'bg-brand-bg text-brand-medium border-green-100']">
				{{ bookingAlert }}
			</p>
		</div>

		<div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
			<h3 class="text-lg font-bold text-brand-dark mt-0 mb-4">Your Bookings</h3>
			<div v-if="confirmationNotice" class="mb-4 p-3 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm font-semibold">
				{{ confirmationNotice }}
			</div>
			<div v-if="loadingBookings" class="text-sm text-gray-500">Loading your bookings...</div>
			<div v-else-if="!bookingsEndpointReady" class="p-4 rounded-xl border border-dashed border-amber-200 bg-amber-50 text-amber-800 text-sm">
				Booking API endpoint not available yet. Expected endpoint: GET /api/bookings/visitor/:visitorId
			</div>
			<div v-else-if="visitorBookings.length === 0" class="text-sm text-gray-500">No bookings found yet.</div>
			<div v-else class="overflow-x-auto">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b border-gray-100 text-[11px] uppercase font-bold text-brand-medium tracking-wider">
							<th class="pb-3">Booking ID</th>
							<th class="pb-3">Image</th>
							<th class="pb-3">Accommodation</th>
							<th class="pb-3">Check-In</th>
							<th class="pb-3">Check-Out</th>
							<th class="pb-3">Status</th>
						</tr>
					</thead>
					<tbody class="text-sm font-medium text-gray-700 divide-y divide-gray-50">
						<tr v-for="booking in visitorBookings" :key="booking.id">
							<td class="py-3.5 text-gray-600 font-semibold">#{{ booking.id }}</td>
							<td class="py-3.5">
								<img
									:src="bookingImageUrl(booking.image_url)"
									@error="onBookingImageError"
									:alt="booking.accommodation_title || 'Accommodation image'"
									class="w-16 h-12 rounded-lg object-cover border border-green-100"
								/>
							</td>
							<td class="py-3.5 font-bold text-brand-dark">{{ booking.accommodation_title || booking.accommodation_name || ('Accommodation #' + booking.accommodation_id) }}</td>
							<td class="py-3.5 text-gray-600">{{ formatDate(booking.check_in_date || booking.booking_date) }}</td>
							<td class="py-3.5 text-gray-600">{{ formatDate(booking.check_out_date) }}</td>
							<td class="py-3.5">
								<span :class="statusBadgeClass(booking.status)" class="px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide">
									{{ booking.status || 'pending' }}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export default {
	props: {
		currentUser: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			accommodations: [],
			visitorBookings: [],
			loadingAccommodations: true,
			loadingBookings: true,
			submitting: false,
			bookingsEndpointReady: true,
			confirmationNotice: '',
			hasLoadedBookingSnapshot: false,
			knownConfirmedBookingIds: [],
			bookingPoller: null,
			bookingAlert: '',
			bookingAlertIsError: false,
			today: new Date().toISOString().slice(0, 10),
			bookingForm: {
				accommodation_id: '',
				check_in_date: new Date().toISOString().slice(0, 10),
				check_out_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
				status: 'pending'
			}
		};
	},
	computed: {
		availableAccommodations() {
			return this.accommodations.filter((item) => Number(item.price_per_night) > 0);
		},
		selectedAccommodation() {
			return this.availableAccommodations.find((item) => String(item.id) === String(this.bookingForm.accommodation_id)) || null;
		}
	},
	async created() {
		await Promise.all([this.loadAccommodations(), this.loadVisitorBookings()]);
		this.startBookingPolling();

		if (!this.bookingForm.accommodation_id && this.availableAccommodations[0]) {
			this.bookingForm.accommodation_id = String(this.availableAccommodations[0].id);
		}
	},
	beforeUnmount() {
		this.stopBookingPolling();
	},
	methods: {
		async loadAccommodations() {
			this.loadingAccommodations = true;
			try {
				const response = await axios.get(`${API_BASE_URL}/api/accommodations`);
				this.accommodations = response.data || [];
			} catch (error) {
				console.error('Error loading accommodations for bookings:', error);
				this.bookingAlertIsError = true;
				this.bookingAlert = 'Unable to load accommodations right now.';
			} finally {
				this.loadingAccommodations = false;
			}
		},
		async loadVisitorBookings() {
			this.loadingBookings = true;
			this.bookingsEndpointReady = true;

			try {
				const response = await axios.get(`${API_BASE_URL}/api/bookings/visitor/${this.currentUser.id}`);
				const bookings = response.data || [];
				const confirmedIds = bookings
					.filter((item) => String(item.status || '').toLowerCase() === 'confirmed')
					.map((item) => item.id);

				if (this.hasLoadedBookingSnapshot) {
					const newlyConfirmed = confirmedIds.filter((id) => !this.knownConfirmedBookingIds.includes(id));
					if (newlyConfirmed.length) {
						this.confirmationNotice = newlyConfirmed.length === 1
							? `Your booking #${newlyConfirmed[0]} has been confirmed by the owner.`
							: `${newlyConfirmed.length} of your bookings have been confirmed by owners.`;
					}
				} else if (confirmedIds.length) {
					this.confirmationNotice = `You have ${confirmedIds.length} confirmed booking${confirmedIds.length > 1 ? 's' : ''}.`;
				}

				this.knownConfirmedBookingIds = confirmedIds;
				this.hasLoadedBookingSnapshot = true;
				this.visitorBookings = bookings;
			} catch (error) {
				if (error.response?.status === 404) {
					this.bookingsEndpointReady = false;
					this.visitorBookings = [];
				} else {
					console.error('Error loading visitor bookings:', error);
					this.bookingAlertIsError = true;
					this.bookingAlert = error.response?.data?.message || 'Unable to load your bookings.';
				}
			} finally {
				this.loadingBookings = false;
			}
		},
		startBookingPolling() {
			this.stopBookingPolling();
			this.bookingPoller = window.setInterval(() => {
				this.loadVisitorBookings();
			}, 5000);
		},
		stopBookingPolling() {
			if (this.bookingPoller) {
				window.clearInterval(this.bookingPoller);
				this.bookingPoller = null;
			}
		},
		async submitBooking() {
			if (!this.currentUser?.id) {
				this.bookingAlertIsError = true;
				this.bookingAlert = 'You must be signed in to create a booking.';
				return;
			}

			this.bookingAlert = '';
			this.bookingAlertIsError = false;
			this.submitting = true;

			if (new Date(this.bookingForm.check_out_date) <= new Date(this.bookingForm.check_in_date)) {
				this.bookingAlertIsError = true;
				this.bookingAlert = 'Check-out date must be after check-in date.';
				this.submitting = false;
				return;
			}

			const payload = {
				visitor_id: Number(this.currentUser.id),
				accommodation_id: Number(this.bookingForm.accommodation_id),
				booking_date: this.bookingForm.check_in_date,
				check_in_date: this.bookingForm.check_in_date,
				check_out_date: this.bookingForm.check_out_date,
				status: 'pending'
			};

			try {
				await axios.post(`${API_BASE_URL}/api/bookings`, payload);
				this.bookingAlert = 'Booking saved successfully.';
				await this.loadVisitorBookings();
			} catch (error) {
				console.error('Error saving booking:', error);
				this.bookingAlertIsError = true;
				this.bookingAlert = error.response?.data?.message || 'Failed to save booking.';
			} finally {
				this.submitting = false;
			}
		},
		formatPrice(value) {
			const parsed = Number(value || 0);
			return `€${Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00'}`;
		},
		formatDate(value) {
			if (!value) {
				return 'Not set';
			}

			const date = new Date(value);
			if (Number.isNaN(date.getTime())) {
				return value;
			}

			return date.toLocaleDateString();
		},
		bookingImageUrl(value) {
			if (!value) {
				return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80';
			}

			const normalizedPath = String(value).replace(/\\/g, '/').trim();

			if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
				return normalizedPath;
			}

			if (normalizedPath.startsWith('/uploads/')) {
				return `${API_BASE_URL}${normalizedPath}`;
			}

			if (normalizedPath.startsWith('uploads/')) {
				return `${API_BASE_URL}/${normalizedPath}`;
			}

			if (normalizedPath.startsWith('src/images/cabins/')) {
				return `/cabins/${normalizedPath.split('/').pop()}`;
			}

			if (normalizedPath.startsWith('/cabins/')) {
				return normalizedPath;
			}

			return `/cabins/${normalizedPath.split('/').pop()}`;
		},
		onBookingImageError(event) {
			event.target.src = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80';
		},
		statusBadgeClass(status) {
			const normalizedStatus = String(status || 'pending').toLowerCase();
			if (normalizedStatus === 'confirmed' || normalizedStatus === 'approved') {
				return 'bg-green-100 text-green-700';
			}

			if (normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
				return 'bg-red-100 text-red-700';
			}

			return 'bg-amber-100 text-amber-700';
		}
	}
};
</script>
