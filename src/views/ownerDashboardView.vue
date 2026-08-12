<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-1 space-y-6">
      <div
        class="p-4 rounded-xl border text-sm"
        :class="hasApprovedListings ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'"
      >
        <p class="font-bold">
          {{ hasApprovedListings ? 'Approval granted. Owner tools unlocked.' : 'Waiting for admin approval.' }}
        </p>
        <p class="mt-1">
          {{ hasApprovedListings
            ? 'You can continue adding and managing accommodations. New submissions will still be moderated.'
            : 'Your property request is pending review. Once approved by admin, you can manage accommodations fully.' }}
        </p>
      </div>

      <div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm backdrop-blur-md bg-white/95">
        <h3 class="text-lg font-bold text-brand-dark mt-0 mb-1">Register a New Property</h3>
        <p class="text-xs text-gray-500 mb-4">Submit the parent property first. Nightly pricing now lives on the accommodation form.</p>

        <form @submit.prevent="submitPropertyForm" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Property Name</label>
            <input v-model="propertyForm.title" type="text" placeholder="e.g., Mindo Hummingbird Pod" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Address</label>
            <input v-model="propertyForm.address" type="text" placeholder="e.g., Quito - Mindo Road 12" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Property Type</label>
            <select v-model="propertyForm.property_type" class="choco-input text-sm" required>
              <option value="rooms">Rooms</option>
              <option value="cabins">Cabins</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Number of Rooms / Cabins</label>
            <input v-model="propertyForm.unit_count" type="number" min="1" placeholder="4" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Location Zone</label>
            <input v-model="propertyForm.location" type="text" placeholder="e.g., Mindo Reserve" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Sanctuary Description</label>
            <textarea v-model="propertyForm.description" rows="3" placeholder="Describe the physical immersion context details..." class="choco-input text-sm resize-none" required></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <label class="flex items-center gap-2"><input type="checkbox" v-model="propertyForm.has_ac" /> AC / Radiator</label>
            <label class="flex items-center gap-2"><input type="checkbox" v-model="propertyForm.has_parking" /> Parking</label>
            <label class="flex items-center gap-2"><input type="checkbox" v-model="propertyForm.has_room_service" /> Room Service</label>
            <label class="flex items-center gap-2"><input type="checkbox" v-model="propertyForm.has_private_wc" /> Private WC</label>
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Upload Image</label>
            <input ref="propertyImageInput" type="file" accept="image/*" @change="handleImageUpload('property', $event)" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-bg file:text-brand-medium hover:file:bg-green-100" />
            <p v-if="uploadingTarget === 'property'" class="text-xs text-brand-medium mt-2">Uploading image...</p>
          </div>
          <div v-if="propertyForm.image_url" class="text-xs text-brand-medium">
            Selected image: {{ propertyForm.image_url }}
          </div>

          <button type="submit" class="choco-btn-primary text-xs uppercase tracking-wider py-2.5">
            Submit for Approval
          </button>
        </form>

        <p v-if="propertyAlert" class="mt-4 text-xs font-semibold p-2.5 bg-brand-bg text-brand-medium border border-green-100 rounded-lg text-center">
          {{ propertyAlert }}
        </p>
      </div>
    </div>

    <div class="lg:col-span-2 space-y-6">
      <div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div>
            <h3 class="text-lg font-bold text-brand-dark mt-0 mb-1">Booking Requests</h3>
            <p class="text-xs text-gray-500">Confirm or decline visitor requests for your accommodations.</p>
          </div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand-medium">{{ pendingBookingCount }} pending</span>
        </div>

        <p v-if="ownerBookingAlert" class="mb-4 text-xs font-semibold p-2.5 bg-brand-bg text-brand-medium border border-green-100 rounded-lg text-center">
          {{ ownerBookingAlert }}
        </p>

        <div v-if="ownerBookingRequests.length === 0" class="text-sm text-gray-500">No booking requests found.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-100 text-[11px] uppercase font-bold text-brand-medium tracking-wider">
                <th class="pb-3">Booking</th>
                <th class="pb-3">Accommodation</th>
                <th class="pb-3">Visitor</th>
                <th class="pb-3">Dates</th>
                <th class="pb-3">Status</th>
                <th class="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="text-sm font-medium text-gray-700 divide-y divide-gray-50">
              <tr v-for="booking in ownerBookingRequests" :key="booking.id">
                <td class="py-3.5 font-bold text-brand-dark">#{{ booking.id }}</td>
                <td class="py-3.5 text-gray-600">{{ booking.accommodation_title || ('Accommodation #' + booking.accommodation_id) }}</td>
                <td class="py-3.5 text-gray-600">{{ booking.visitor_name || booking.visitor_email || ('Visitor #' + booking.visitor_id) }}</td>
                <td class="py-3.5 text-gray-500">{{ formatDate(booking.check_in_date || booking.booking_date) }} - {{ formatDate(booking.check_out_date) }}</td>
                <td class="py-3.5">
                  <span
                    class="px-2 py-0.5 border text-[10px] font-bold uppercase rounded"
                    :class="statusBadgeClass(booking.status)"
                  >
                    {{ booking.status || 'pending' }}
                  </span>
                </td>
                <td class="py-3.5 text-right">
                  <div v-if="booking.status === 'pending'" class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded border border-green-200 bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wide hover:bg-green-100"
                      @click="moderateBooking(booking.id, 'confirmed')"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded border border-red-200 bg-red-50 text-red-700 text-[11px] font-bold uppercase tracking-wide hover:bg-red-100"
                      @click="moderateBooking(booking.id, 'declined')"
                    >
                      Decline
                    </button>
                  </div>
                  <span v-else class="text-xs text-gray-400 font-semibold uppercase">Processed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div>
            <h3 class="text-lg font-bold text-brand-dark mt-0 mb-1">Monthly Revenue by Property</h3>
            <p class="text-xs text-gray-500">Revenue includes confirmed and completed bookings only.</p>
          </div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand-medium">{{ ownerRevenueReport.length }} rows</span>
        </div>

        <div v-if="ownerRevenueReport.length === 0" class="text-sm text-gray-500">No revenue data available yet.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-100 text-[11px] uppercase font-bold text-brand-medium tracking-wider">
                <th class="pb-3">Month</th>
                <th class="pb-3">Property</th>
                <th class="pb-3">Total Bookings</th>
                <th class="pb-3">Confirmed</th>
                <th class="pb-3">Cancelled</th>
                <th class="pb-3">Declined</th>
                <th class="pb-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody class="text-sm font-medium text-gray-700 divide-y divide-gray-50">
              <tr v-for="row in ownerRevenueReport" :key="`${row.report_month}-${row.property_id}`">
                <td class="py-3.5 text-gray-600">{{ formatMonth(row.report_month) }}</td>
                <td class="py-3.5 font-bold text-brand-dark">{{ row.property_title || ('Property #' + row.property_id) }}</td>
                <td class="py-3.5 text-gray-600">{{ Number(row.total_bookings || 0) }}</td>
                <td class="py-3.5 text-green-700 font-semibold">{{ Number(row.confirmed_bookings || 0) }}</td>
                <td class="py-3.5 text-red-700 font-semibold">{{ Number(row.cancelled_bookings || 0) }}</td>
                <td class="py-3.5 text-amber-700 font-semibold">{{ Number(row.declined_bookings || 0) }}</td>
                <td class="py-3.5 text-right font-bold text-brand-dark">{{ formatCurrency(row.revenue_total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-center">
          <span class="block text-2xl font-black text-brand-dark">{{ approvedCount }}</span>
          <span class="text-[10px] uppercase font-bold text-brand-medium tracking-wider">Approved Listings</span>
        </div>
        <div class="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-center">
          <span class="block text-2xl font-black text-brand-dark">{{ pendingCount }}</span>
          <span class="text-[10px] uppercase font-bold text-brand-medium tracking-wider">Pending Review</span>
        </div>
        <div class="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-center">
          <span class="block text-2xl font-black" :class="hasApprovedListings ? 'text-green-700' : 'text-amber-600'">{{ hasApprovedListings ? 'Unlocked' : 'Locked' }}</span>
          <span class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Owner Tools</span>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div>
            <h3 class="text-lg font-bold text-brand-dark mt-0 mb-1">Last Property Submissions</h3>
            <p class="text-xs text-gray-500">Latest submissions first, showing the most recent property records.</p>
          </div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand-medium">{{ ownerProperties.length }} total submissions</span>
        </div>
        <div v-if="ownerProperties.length === 0" class="text-sm text-gray-500">No property submissions yet.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-100 text-[11px] uppercase font-bold text-brand-medium tracking-wider">
                <th class="pb-3">Property Name</th>
                <th class="pb-3">Type</th>
                <th class="pb-3">Address</th>
                <th class="pb-3">Location</th>
                <th class="pb-3">Rooms / Cabins</th>
                <th class="pb-3">Submitted</th>
                <th class="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="text-sm font-medium text-gray-700 divide-y divide-gray-50">
              <tr v-for="item in ownerProperties" :key="item.id">
                <td class="py-3.5 font-bold text-brand-dark">{{ item.title }}</td>
                <td class="py-3.5 text-gray-600 capitalize">{{ item.property_type || 'property' }}</td>
                <td class="py-3.5 text-gray-500">{{ item.address || 'Not provided' }}</td>
                <td class="py-3.5 text-gray-500">{{ item.location }}</td>
                <td class="py-3.5 text-gray-600">{{ item.unit_count || 0 }}</td>
                <td class="py-3.5 text-gray-500">{{ formatDate(item.created_at) }}</td>
                <td class="py-3.5 text-right">
                  <span
                    class="px-2 py-0.5 border text-[10px] font-bold uppercase rounded"
                    :class="statusBadgeClass(item.status)"
                  >
                    {{ item.status || 'pending' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    currentUser: {
      type: Object,
      required: true
    },
    ownerProperties: {
      type: Array,
      default: () => []
    },
    propertyAlert: {
      type: String,
      default: ''
    },
    propertyUploadedImageUrl: {
      type: String,
      default: ''
    },
    ownerBookingRequests: {
      type: Array,
      default: () => []
    },
    ownerRevenueReport: {
      type: Array,
      default: () => []
    },
    ownerBookingAlert: {
      type: String,
      default: ''
    },
    propertyFormResetKey: {
      type: Number,
      default: 0
    },
    uploadingTarget: {
      type: String,
      default: ''
    }
  },
  emits: ['submit-property', 'image-upload', 'logout', 'booking-moderation'],
  data() {
    return {
      propertyForm: this.getInitialPropertyForm()
    };
  },
  watch: {
    propertyUploadedImageUrl(newValue) {
      this.propertyForm.image_url = newValue || '';
    },
    propertyFormResetKey() {
      this.resetPropertyForm();
    }
  },
  computed: {
    approvedCount() {
      return this.ownerProperties.filter((item) => item.status === 'approved').length;
    },
    pendingCount() {
      return this.ownerProperties.filter((item) => item.status === 'pending').length;
    },
    hasApprovedListings() {
      return this.approvedCount > 0;
    },
    pendingBookingCount() {
      return this.ownerBookingRequests.filter((item) => item.status === 'pending').length;
    }
  },
  methods: {
    getInitialPropertyForm() {
      return {
        title: '',
        address: '',
        property_type: 'rooms',
        unit_count: '',
        location: '',
        description: '',
        has_ac: false,
        has_parking: false,
        has_room_service: false,
        has_private_wc: false,
        image_url: ''
      };
    },
    resetPropertyForm() {
      this.propertyForm = this.getInitialPropertyForm();
      if (this.$refs.propertyImageInput) {
        this.$refs.propertyImageInput.value = '';
      }
    },
    submitPropertyForm() {
      this.$emit('submit-property', {
        ...this.propertyForm,
        owner_id: this.currentUser.id || 1,
        status: 'pending'
      });
    },
    formatDate(value) {
      if (!value) {
        return 'Unknown';
      }

      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(new Date(value));
    },
    formatMonth(value) {
      if (!value) {
        return 'Unknown';
      }

      const parsed = new Date(`${value}-01T00:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        return String(value);
      }

      return new Intl.DateTimeFormat('en-GB', {
        month: 'long',
        year: 'numeric'
      }).format(parsed);
    },
    formatCurrency(value) {
      const amount = Number(value || 0);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2
      }).format(amount);
    },
    statusBadgeClass(status) {
      if (status === 'approved') {
        return 'bg-green-50 text-green-700 border-green-200';
      }

      if (status === 'rejected') {
        return 'bg-red-50 text-red-700 border-red-200';
      }

      return 'bg-amber-50 text-amber-700 border-amber-200';
    },
    handleImageUpload(target, event) {
      this.$emit('image-upload', { target, event });
    },
    moderateBooking(id, status) {
      this.$emit('booking-moderation', { id, status });
    }
  }
};
</script>