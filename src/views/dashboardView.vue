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
            Welcome back, <span class="font-bold text-brand-medium">{{ currentUser.name }}</span>. Account profile <span class="font-semibold text-brand-dark">{{ currentUser.role || 'visitor' }}</span>
       
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
              :src="toAbsoluteImageUrl(currentUser.profile_photo) || defaultProfilePhoto"
              alt="Profile photo"
              class="w-16 h-16 rounded-full object-cover border-2 border-green-200 shadow-sm"
              @error="onProfileImageError"
            />
            <div>
              <p class="text-[10px] uppercase font-bold tracking-wider text-brand-medium">Profile settings</p>
              <button
                type="button"
                @click="toggleUserDetails"
                class="text-left text-xl font-black text-brand-dark mt-1 hover:text-brand-medium transition underline decoration-1 decoration-brand-medium/60 underline-offset-6"
              >
                Account details
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
          <button
            type="button"
            @click="openProfileSettings"
            class="inline-flex items-center justify-center w-10 h-10 border border-green-200 rounded-lg bg-brand-bg text-brand-medium hover:bg-green-100 transition"
            aria-label="Edit user settings"
            title="Edit account settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.065 2.573c.94 1.543-.827 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.065c-1.543.94-3.31-.827-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.065-2.573c-.94-1.543.827-3.31 2.37-2.37.996.607 2.33.192 2.572-1.065Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <label class="cursor-pointer inline-flex items-center justify-center px-3 py-2 border border-green-200 rounded-lg bg-brand-bg text-brand-medium text-[10px] font-bold uppercase tracking-wider hover:bg-green-100">
            Upload photo
            <input type="file" accept="image/*" class="hidden" @change="handleProfilePhotoUpload" />
          </label>
          <button
            type="button"
            @click="saveProfileChanges"
            class="px-4 py-2 bg-[#2E7D32] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#1B5E20] transition border border-[#1B5E20] shadow-sm"
          >
            Save changes
          </button>
        </div>
      </div>

      <div v-if="showUserDetails" class="mt-5 space-y-2 text-sm text-brand-dark">
        <p><span class="font-bold text-brand-medium uppercase tracking-wider text-[10px] mr-2">Email:</span> {{ currentUser.email || 'Not available' }}</p>
        <p><span class="font-bold text-brand-medium uppercase tracking-wider text-[10px] mr-2">Date of birth:</span> {{ formatDisplayDate(currentUser.date_of_birth) || 'Not provided' }}</p>
        <p><span class="font-bold text-brand-medium uppercase tracking-wider text-[10px] mr-2">Role:</span> {{ currentUser.role || 'visitor' }}</p>
      </div>
    </section>

      <div v-if="showSettingsModal" class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div class="w-full max-w-xl rounded-2xl bg-white border border-green-100 shadow-2xl p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <p class="text-[10px] uppercase font-bold tracking-wider text-brand-medium">Profile settings</p>
              <h3 class="text-xl font-black text-brand-dark mt-1">Edit account details</h3>
            </div>
            <button type="button" @click="closeProfileSettings" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition text-lg leading-none">×</button>
          </div>

          <div class="space-y-5">
            <div class="rounded-xl bg-brand-bg p-4 border border-green-100">
              <label class="block text-[10px] font-bold uppercase tracking-wider text-brand-medium mb-2">Display name</label>
              <input v-model="profileForm.name" type="text" class="choco-input text-sm" placeholder="Your name" />
            </div>

            <div class="rounded-xl bg-brand-bg p-4 border border-green-100">
              <label class="block text-[10px] font-bold uppercase tracking-wider text-brand-medium mb-2">Date of birth</label>
              <input v-model="profileForm.date_of_birth" type="date" class="choco-input text-sm" />
            </div>

            <div class="rounded-xl bg-brand-bg p-4 border border-green-100">
              <label class="block text-[10px] font-bold uppercase tracking-wider text-brand-medium mb-2">New password</label>
              <input v-model="profileForm.password" type="password" class="choco-input text-sm" placeholder="Leave blank to keep current" />
            </div>
          </div>

          <div class="mt-6 flex items-center justify-between gap-3">
            <button type="button" @click="saveProfileChanges" class="flex-1 px-4 py-2.5 bg-[#2E7D32] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#1B5E20] transition border border-[#1B5E20] shadow-md">
              Save details
            </button>
            <button type="button" @click="confirmDeleteAccount" class="flex-1 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold uppercase tracking-wider rounded-lg transition">
              Delete account
            </button>
          </div>

          <div v-if="showDeleteConfirmation" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p class="text-xs font-bold uppercase tracking-wider text-red-700 mb-2">Confirm account deactivation</p>
            <p class="text-sm text-red-700 mb-3">This will deactivate your account and block future sign-ins.</p>
            <input v-model="deletePassword" type="password" class="choco-input text-sm mb-3" placeholder="Enter your password to continue" />
            <div class="flex items-center gap-3">
              <button type="button" @click="cancelDeleteAccount" class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-[10px] font-bold uppercase tracking-wider rounded-lg transition">
                Keep account
              </button>
              <button type="button" @click="finalizeDeleteAccount" class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white border border-red-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition">
                Delete now
              </button>
            </div>
          </div>

          <div v-if="profileFeedback" class="mt-4 text-xs font-semibold p-2.5 rounded-lg border" :class="profileFeedbackType === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'">
            {{ profileFeedback }}
          </div>
        </div>
      </div>

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
      defaultProfilePhoto: '',
      profileForm: {
        name: '',
        date_of_birth: '',
        password: '',
        profile_photo: ''
      },
      profileFeedback: '',
      profileFeedbackType: 'success',
      profilePhotoUploading: false,
      showSettingsModal: false,
      showUserDetails: false,
      showDeleteConfirmation: false,
      deletePassword: ''
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

    const parsedUser = JSON.parse(storedUser);
    this.currentUser = {
      ...parsedUser,
      role: String(parsedUser?.role || 'visitor').trim().toLowerCase()
    };

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
    formatDisplayDate(value) {
      if (!value) {
        return '';
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return '';
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },
    formatDateForInput(value) {
      if (!value) {
        return '';
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return '';
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    syncProfileForm() {
      const rawDob = this.currentUser.date_of_birth || this.currentUser.dateOfBirth || '';
      this.profileForm = {
        name: this.currentUser.name || '',
        date_of_birth: rawDob ? this.formatDateForInput(rawDob) : '',
        password: '',
        profile_photo: this.currentUser.profile_photo || ''
      };
    },
    toggleUserDetails() {
      this.showUserDetails = !this.showUserDetails;
    },
    toAbsoluteImageUrl(imageUrl) {
      if (!imageUrl) {
        return '';
      }

      if (/^https?:\/\//i.test(imageUrl)) {
        return imageUrl;
      }

      if (imageUrl.startsWith('/uploads/')) {
        return `http://localhost:3000${imageUrl}`;
      }

      return imageUrl;
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

        const uploadedImageUrl = this.toAbsoluteImageUrl(response.data.imageUrl);
        this.profileForm.profile_photo = uploadedImageUrl;
        this.currentUser.profile_photo = uploadedImageUrl;
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
          date_of_birth: this.profileForm.date_of_birth || null,
          profile_photo: this.profileForm.profile_photo || this.currentUser.profile_photo || null,
          ...(this.profileForm.password && this.profileForm.password.trim() ? { password: this.profileForm.password.trim() } : {})
        };

        const response = await axios.patch(`http://localhost:3000/api/auth/user/${this.currentUser.id}`, payload);

        this.currentUser = {
          ...this.currentUser,
          name: response.data.user.name,
          date_of_birth: response.data.user.date_of_birth || this.currentUser.date_of_birth || null,
          profile_photo: response.data.user.profile_photo || this.currentUser.profile_photo || null
        };

        localStorage.setItem('userData', JSON.stringify(this.currentUser));
        this.profileForm.password = '';
        this.profileFeedback = response.data.message || 'Profile updated successfully.';
        this.profileFeedbackType = 'success';
        this.showSettingsModal = false;

        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        setTimeout(() => {
          this.$router.push('/login');
        }, 1000);
      } catch (err) {
        console.error('Error updating profile:', err);
        this.profileFeedback = err.response?.data?.message || 'Failed to update profile.';
        this.profileFeedbackType = 'error';
      }
    },
    openProfileSettings() {
      this.syncProfileForm();
      this.profileFeedback = '';
      this.showSettingsModal = true;
    },
    closeProfileSettings() {
      this.showSettingsModal = false;
      this.showDeleteConfirmation = false;
      this.deletePassword = '';
      this.profileFeedback = '';
    },
    confirmDeleteAccount() {
      this.deletePassword = '';
      this.profileFeedback = '';
      this.showDeleteConfirmation = true;
    },
    cancelDeleteAccount() {
      this.showDeleteConfirmation = false;
      this.deletePassword = '';
      this.profileFeedback = 'Account deletion cancelled. Your account remains active.';
      this.profileFeedbackType = 'success';
    },
    async finalizeDeleteAccount() {
      if (!this.deletePassword || !this.deletePassword.trim()) {
        this.profileFeedback = 'Password confirmation is required to delete your account.';
        this.profileFeedbackType = 'error';
        return;
      }

      this.showDeleteConfirmation = false;
      await this.deleteAccount(this.deletePassword.trim());
    },
    async deleteAccount(passwordValue) {
      const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
      const userId = Number(this.currentUser?.id ?? storedUser?.id);

      if (!Number.isInteger(userId) || userId <= 0) {
        this.profileFeedback = 'Session is missing user information.';
        this.profileFeedbackType = 'error';
        return;
      }

      this.currentUser = { ...this.currentUser, ...storedUser, id: userId };

      try {
        const token = localStorage.getItem('userToken');
        await axios.delete(`http://localhost:3000/api/auth/user/${userId}`, {
          data: { password: passwordValue },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        this.showSettingsModal = false;
        this.profileFeedback = 'Account deleted. Contact admin to re-open it.';
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

