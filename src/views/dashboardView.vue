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

      <section class="mb-8 bg-white rounded-2xl border border-green-100 shadow-sm p-5">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div class="flex items-center gap-4">
            <img
              :src="currentUser.profile_photo || defaultProfilePhoto"
              alt="Profile photo"
              class="w-16 h-16 rounded-full object-cover border-2 border-green-200 shadow-sm"
              @error="onProfileImageError"
            />
            <div>
              <p class="text-[10px] uppercase font-bold tracking-wider text-brand-medium">Profile settings</p>
              <h2 class="text-xl font-black text-brand-dark mt-1">Account details</h2>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <label class="cursor-pointer inline-flex items-center justify-center px-3 py-2 border border-green-200 rounded-lg bg-brand-bg text-brand-medium text-[10px] font-bold uppercase tracking-wider hover:bg-green-100">
              Upload photo
              <input type="file" accept="image/*" class="hidden" @change="handleProfilePhotoUpload" />
            </label>
            <button
              type="button"
              @click="saveProfileChanges"
              class="px-4 py-2 bg-brand-medium text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-brand-dark transition"
            >
              Save changes
            </button>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2">
            <label class="block text-[10px] font-bold uppercase tracking-wider text-brand-medium mb-2">Display name</label>
            <input v-model="profileForm.name" type="text" class="choco-input text-sm" placeholder="Your name" />
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider text-brand-medium mb-2">New password</label>
            <input v-model="profileForm.password" type="password" class="choco-input text-sm" placeholder="Leave blank to keep current" />
          </div>
        </div>

        <div v-if="profileFeedback" class="mt-4 text-xs font-semibold p-2.5 rounded-lg border" :class="profileFeedbackType === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'">
          {{ profileFeedback }}
        </div>

        <div class="mt-5 flex justify-end">
          <button
            type="button"
            @click="deleteAccount"
            class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold uppercase tracking-wider rounded-lg transition"
          >
            Deactivate account
          </button>
        </div>
      </section>

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
      adminStatusFilter: 'pending',
      defaultProfilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
      profileForm: {
        name: '',
        password: '',
        profile_photo: ''
      },
      profileFeedback: '',
      profileFeedbackType: 'success',
      profilePhotoUploading: false
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

    this.syncProfileForm();

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
    syncProfileForm() {
      this.profileForm = {
        name: this.currentUser.name || '',
        password: '',
        profile_photo: this.currentUser.profile_photo || ''
      };
    },
    onProfileImageError(event) {
      event.target.src = this.defaultProfilePhoto;
    },
    async handleProfilePhotoUpload(event) {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      this.profilePhotoUploading = true;
      this.profileFeedback = 'Uploading profile photo...';
      this.profileFeedbackType = 'success';

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await axios.post('http://localhost:3000/api/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        this.profileForm.profile_photo = response.data.imageUrl;
        this.currentUser.profile_photo = response.data.imageUrl;
        this.profileFeedback = 'Profile photo uploaded successfully.';
        this.profileFeedbackType = 'success';
        localStorage.setItem('userData', JSON.stringify(this.currentUser));
      } catch (err) {
        console.error('Profile photo upload failed:', err);
        this.profileFeedback = 'Failed to upload profile photo.';
        this.profileFeedbackType = 'error';
      } finally {
        this.profilePhotoUploading = false;
        event.target.value = '';
      }
    },
    async saveProfileChanges() {
      if (!this.currentUser.id) {
        this.profileFeedback = 'Session is missing user information.';
        this.profileFeedbackType = 'error';
        return;
      }

      if (!this.profileForm.name || !this.profileForm.name.trim()) {
        this.profileFeedback = 'Please enter a name before saving.';
        this.profileFeedbackType = 'error';
        return;
      }

      try {
        const payload = {
          name: this.profileForm.name.trim(),
          profile_photo: this.profileForm.profile_photo || this.currentUser.profile_photo || null,
          ...(this.profileForm.password && this.profileForm.password.trim() ? { password: this.profileForm.password.trim() } : {})
        };

        const response = await axios.patch(`http://localhost:3000/api/auth/user/${this.currentUser.id}`, payload);

        this.currentUser = {
          ...this.currentUser,
          name: response.data.user.name,
          profile_photo: response.data.user.profile_photo || this.currentUser.profile_photo || null
        };

        localStorage.setItem('userData', JSON.stringify(this.currentUser));
        this.profileForm.password = '';
        this.profileFeedback = response.data.message || 'Profile updated successfully.';
        this.profileFeedbackType = 'success';
      } catch (err) {
        console.error('Error updating profile:', err);
        this.profileFeedback = err.response?.data?.message || 'Failed to update profile.';
        this.profileFeedbackType = 'error';
      }
    },
    async deleteAccount() {
      if (!this.currentUser.id) {
        this.profileFeedback = 'Session is missing user information.';
        this.profileFeedbackType = 'error';
        return;
      }

      const passwordValue = window.prompt('To confirm deletion, please enter your password:');
      if (passwordValue === null) {
        return;
      }

      if (!passwordValue.trim()) {
        this.profileFeedback = 'Password confirmation is required to delete your account.';
        this.profileFeedbackType = 'error';
        return;
      }

      const confirmed = window.confirm('This will deactivate your account and block future sign-ins. Continue?');
      if (!confirmed) {
        return;
      }

      try {
        await axios.delete(`http://localhost:3000/api/auth/user/${this.currentUser.id}`, {
          data: { password: passwordValue }
        });

        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        this.profileFeedback = 'Account deactivated successfully.';
        this.profileFeedbackType = 'success';
        this.$router.push('/login');
      } catch (err) {
        console.error('Error deactivating account:', err);
        this.profileFeedback = err.response?.data?.message || 'Failed to deactivate account.';
        this.profileFeedbackType = 'error';
      }
    },
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

