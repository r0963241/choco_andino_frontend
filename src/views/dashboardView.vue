<template>
  <div class="min-h-screen bg-brand-bg text-[#333] font-sans p-6">
    <div class="max-w-7xl mx-auto">
      
      <!-- HEADER CONTEXT BAR -->
      <header class="flex flex-col md:flex-row md:items-center md:justify-between border-b border-green-100 pb-6 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-brand-dark tracking-tight mt-0 font-sans">
            Sanctuary Control Panel
          </h1>
          <p class="text-sm text-gray-500 mt-1 font-sans">
            Welcome back, <span class="font-bold text-brand-medium">{{ currentUser.name }}</span>. Account profile access tier: 
            <span class="px-2 py-0.5 bg-brand-medium text-white text-xs font-bold rounded-full uppercase tracking-wider">{{ currentUser.role }}</span>
            <span
              v-if="currentUser.role === 'owner' && pendingOwnerBookingCount > 0"
              class="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider border border-amber-200"
            >
              {{ pendingOwnerBookingCount }} booking request{{ pendingOwnerBookingCount > 1 ? 's' : '' }}
            </span>
          </p>
        </div>
        <button @click="handleLogout" class="mt-4 md:mt-0 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider rounded-lg transition border border-red-200">
          Disconnect Session
        </button>
      </header>

      <!-- DYNAMIC ROLE INTERFACE VIEW INJECTION PORTAL -->
      <div class="fade-in-tab">
        <bookingDashboardView v-if="currentUser.role === 'visitor'" :current-user="currentUser" />

        <div v-else-if="currentUser.role === 'owner'" class="space-y-8">
          <ownerDashboardView
            :current-user="currentUser"
            :owner-properties="ownerProperties"
            :property-alert="propertyAlert"
            :property-uploaded-image-url="propertyUploadedImageUrl"
            :owner-booking-requests="ownerBookingRequests"
            :owner-revenue-report="ownerRevenueReport"
            :owner-booking-alert="ownerBookingAlert"
            :property-form-reset-key="propertyFormResetKey"
            :uploading-target="uploadingTarget"
            @submit-property="submitProperty"
            @image-upload="handleImageUpload"
            @booking-moderation="handleOwnerBookingModeration"
          />

          <accomodationDashboardView
            :current-user="currentUser"
            :owner-properties="ownerProperties"
            :owner-accommodations="ownerAccommodations"
            :accommodation-alert="accommodationAlert"
            :accommodation-uploaded-image-url="accommodationUploadedImageUrl"
            :accommodation-form-reset-key="accommodationFormResetKey"
            :uploading-target="uploadingTarget"
            @submit-accommodation="submitAccommodation"
            @image-upload="handleImageUpload"
          />
        </div>

        <adminDashboardView
          v-else-if="currentUser.role === 'admin'"
          :current-user="currentUser"
          :pending-listings="pendingListings"
          :pending-count="pendingCount"
          :admin-revenue-report="adminRevenueReport"
          :selected-status="adminStatusFilter"
          :admin-alert="adminAlert"
          :processing-ids="processingIds"
          @refresh="loadPendingListings"
          @status-change="handleAdminStatusChange"
          @moderate="handleModeration"
        />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import accomodationDashboardView from './accomodationDashboardView.vue';
import bookingDashboardView from './bookingDashboardView.vue';
import ownerDashboardView from './ownerDashboardView.vue';
import adminDashboardView from './adminDashboardView.vue';

export default {
  components: {
    accomodationDashboardView,
    bookingDashboardView,
    ownerDashboardView,
    adminDashboardView
  },
  data() {
    return {
      currentUser: { name: 'Explorer', role: 'visitor' },
      ownerProperties: [],
      ownerAccommodations: [],
      pendingListings: [],
      pendingCount: 0,
      ownerBookingRequests: [],
      ownerRevenueReport: [],
      adminRevenueReport: [],
      propertyAlert: '',
      accommodationAlert: '',
      adminAlert: '',
      ownerBookingAlert: '',
      propertyUploadedImageUrl: '',
      accommodationUploadedImageUrl: '',
      propertyFormResetKey: 0,
      accommodationFormResetKey: 0,
      uploadingTarget: '',
      processingIds: [],
      adminQueuePoller: null,
      ownerBookingPoller: null,
      adminStatusFilter: 'pending'
    };
  },
  computed: {
    pendingOwnerBookingCount() {
      return this.ownerBookingRequests.filter((item) => item.status === 'pending').length;
    }
  },
  async created() {
    const token = localStorage.getItem('userToken');
    const storedUser = localStorage.getItem('userData');
    
    if (!token || !storedUser) {
      alert('⚠️ Session context missing or expired. Redirecting to access panel verification gateway.');
      this.$router.push('/login');
      return;
    }

    this.currentUser = JSON.parse(storedUser);

    if (this.currentUser.role === 'owner') {
      await Promise.all([
        this.loadOwnerProperties(),
        this.loadOwnerAccommodations(),
        this.loadOwnerBookingRequests(),
        this.loadOwnerRevenueReport()
      ]);
      this.startOwnerBookingPolling();
    }

    if (this.currentUser.role === 'admin') {
      await Promise.all([this.loadPendingListings(), this.loadAdminRevenueReport()]);
      this.startAdminQueuePolling();
    }
  },
  beforeUnmount() {
    this.stopAdminQueuePolling();
    this.stopOwnerBookingPolling();
  },
  methods: {
    handleLogout() {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      this.$router.push('/login');
    },
    async loadOwnerProperties() {
      try {
        const response = await axios.get(`http://localhost:3000/api/accommodations/properties/owner/${this.currentUser.id}`);
        this.ownerProperties = response.data;
      } catch (err) {
        console.error('Error loading owner properties:', err);
      }
    },
    async loadOwnerAccommodations() {
      try {
        const response = await axios.get(`http://localhost:3000/api/accommodations/owner/${this.currentUser.id}`);
        this.ownerAccommodations = response.data;
      } catch (err) {
        console.error('Error loading owner accommodations:', err);
      }
    },
    async loadPendingListings() {
      try {
        const [filteredResponse, pendingResponse] = await Promise.all([
          axios.get(`http://localhost:3000/api/accommodations/properties/pending?status=${this.adminStatusFilter}`),
          axios.get('http://localhost:3000/api/accommodations/properties/pending?status=pending')
        ]);

        this.pendingListings = filteredResponse.data;
        this.pendingCount = pendingResponse.data.length;
        if (!this.pendingListings.length && this.adminAlert && !this.adminAlert.toLowerCase().includes('failed')) {
          this.adminAlert = '';
        }
      } catch (err) {
        console.error('Error loading pending accommodations:', err);
        this.adminAlert = 'Failed to load moderation queue.';
      }
    },
    async loadOwnerBookingRequests() {
      try {
        const response = await axios.get(`http://localhost:3000/api/bookings/owner/${this.currentUser.id}?status=all`);
        this.ownerBookingRequests = response.data;
      } catch (err) {
        console.error('Error loading owner booking requests:', err);
        this.ownerBookingAlert = err.response?.data?.message || 'Failed to load booking requests.';
      }
    },
    async loadOwnerRevenueReport() {
      try {
        const response = await axios.get(`http://localhost:3000/api/bookings/owner/${this.currentUser.id}/revenue/monthly`);
        this.ownerRevenueReport = response.data || [];
      } catch (err) {
        console.error('Error loading owner revenue report:', err);
        this.ownerBookingAlert = err.response?.data?.message || 'Failed to load owner revenue report.';
      }
    },
    async loadAdminRevenueReport() {
      try {
        const response = await axios.get('http://localhost:3000/api/bookings/revenue/monthly');
        this.adminRevenueReport = response.data || [];
      } catch (err) {
        console.error('Error loading admin revenue report:', err);
        this.adminAlert = err.response?.data?.message || 'Failed to load monthly revenue report.';
      }
    },
    handleAdminStatusChange(status) {
      this.adminStatusFilter = status;
      this.loadPendingListings();
    },
    startAdminQueuePolling() {
      this.stopAdminQueuePolling();
      this.adminQueuePoller = window.setInterval(() => {
        this.loadPendingListings();
        this.loadAdminRevenueReport();
      }, 5000);
    },
    stopAdminQueuePolling() {
      if (this.adminQueuePoller) {
        window.clearInterval(this.adminQueuePoller);
        this.adminQueuePoller = null;
      }
    },
    startOwnerBookingPolling() {
      this.stopOwnerBookingPolling();
      this.ownerBookingPoller = window.setInterval(() => {
        this.loadOwnerBookingRequests();
        this.loadOwnerRevenueReport();
      }, 5000);
    },
    stopOwnerBookingPolling() {
      if (this.ownerBookingPoller) {
        window.clearInterval(this.ownerBookingPoller);
        this.ownerBookingPoller = null;
      }
    },
    async handleImageUpload(event) {
      const { event: inputEvent, target } = event;
      const file = inputEvent.target.files[0];
      if (!file) return;

      this.uploadingTarget = target;
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await axios.post('http://localhost:3000/api/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (target === 'property') {
          this.propertyUploadedImageUrl = response.data.imageUrl;
          this.propertyAlert = '📸 Property image uploaded successfully.';
        } else {
          this.accommodationUploadedImageUrl = response.data.imageUrl;
          this.accommodationAlert = '📸 Accommodation image uploaded successfully.';
        }
      } catch (err) {
        console.error('Image upload failed:', err);
        if (target === 'property') {
          this.propertyAlert = 'Failed to upload property image.';
        } else {
          this.accommodationAlert = 'Failed to upload accommodation image.';
        }
      } finally {
        this.uploadingTarget = '';
      }
    },
    async submitProperty(formPayload) {
      this.propertyAlert = '';
      
      const payload = {
        ...formPayload,
        owner_id: this.currentUser.id || 1,
        status: 'pending'
      };

      try {
        await axios.post('http://localhost:3000/api/accommodations/properties', payload);
        await this.loadOwnerProperties();
        this.propertyAlert = '🎉 Property submission sent for admin approval.';
        this.propertyUploadedImageUrl = '';
        this.propertyFormResetKey += 1;
      } catch (err) {
        console.error('Error submitting property:', err);
        this.propertyAlert = err.response?.data?.message || 'Failed to save property.';
      }
    },
    async submitAccommodation(formPayload) {
      this.accommodationAlert = '';

      const payload = {
        ...formPayload,
        owner_id: this.currentUser.id || 1,
        status: 'approved'
      };

      try {
        await axios.post('http://localhost:3000/api/accommodations', payload);
        await this.loadOwnerAccommodations();
        this.accommodationAlert = '🎉 Accommodation created successfully.';
        this.accommodationUploadedImageUrl = '';
        this.accommodationFormResetKey += 1;
      } catch (err) {
        console.error('Error submitting accommodation:', err);
        this.accommodationAlert = err.response?.data?.message || 'Failed to save accommodation.';
      }
    },
    async handleOwnerBookingModeration({ id, status }) {
      this.ownerBookingAlert = '';

      try {
        await axios.patch(`http://localhost:3000/api/bookings/${id}/status`, {
          owner_id: this.currentUser.id,
          status
        });
        this.ownerBookingAlert = `Booking ${status} successfully.`;
        await Promise.all([this.loadOwnerBookingRequests(), this.loadOwnerRevenueReport()]);
      } catch (err) {
        console.error('Error moderating owner booking request:', err);
        this.ownerBookingAlert = err.response?.data?.message || 'Failed to update booking request.';
      }
    },
    async handleModeration({ id, status }) {
      this.adminAlert = '';
      this.processingIds = [...this.processingIds, id];

      try {
        await axios.patch(`http://localhost:3000/api/accommodations/properties/${id}/status`, { status });
        this.adminAlert = `Property ${status} successfully.`;
        await this.loadPendingListings();
      } catch (err) {
        console.error('Error updating listing status:', err);
        this.adminAlert = err.response?.data?.message || 'Failed to update listing status.';
      } finally {
        this.processingIds = this.processingIds.filter((itemId) => itemId !== id);
      }
    }
  }
};
</script>

