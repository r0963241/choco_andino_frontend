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
          </p>
        </div>
        <button @click="handleLogout" class="mt-4 md:mt-0 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider rounded-lg transition border border-red-200">
          Disconnect Session
        </button>
      </header>

      <!-- DYNAMIC ROLE INTERFACE VIEW INJECTION PORTAL -->
      <div class="fade-in-tab">
        <visitorDashboardView v-if="currentUser.role === 'visitor'" :current-user="currentUser" />

        <ownerDashboardView
          v-else-if="currentUser.role === 'owner'"
          :current-user="currentUser"
          :owner-listings="ownerListings"
          :form-alert="formAlert"
          :accommodation-form="accommodationForm"
          :uploading-image="uploadingImage"
          @submit="submitAccommodation"
          @image-upload="handleImageUpload"
        />

        <adminDashboardView
          v-else-if="currentUser.role === 'admin'"
          :current-user="currentUser"
          :pending-listings="pendingListings"
          :admin-alert="adminAlert"
          :processing-ids="processingIds"
          @refresh="loadPendingListings"
          @moderate="handleModeration"
        />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import visitorDashboardView from './visitorDashboardView.vue';
import ownerDashboardView from './ownerDashboardView.vue';
import adminDashboardView from './adminDashboardView.vue';

export default {
  components: {
    visitorDashboardView,
    ownerDashboardView,
    adminDashboardView
  },
  data() {
    return {
      currentUser: { name: 'Explorer', role: 'visitor' },
      ownerListings: [],
      pendingListings: [],
      formAlert: '',
      adminAlert: '',
      accommodationForm: {
        title: '',
        address: '',
        property_type: 'rooms',
        unit_count: '',
        location: '',
        price_per_night: '',
        description: '',
        has_ac: false,
        has_parking: false,
        has_room_service: false,
        has_private_wc: false,
        image_url: ''
      },
      uploadingImage: false,
      processingIds: []
    };
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
      await this.loadOwnerListings();
    }

    if (this.currentUser.role === 'admin') {
      await this.loadPendingListings();
    }
  },
  methods: {
    handleLogout() {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      this.$router.push('/login');
    },
    async loadOwnerListings() {
      try {
        const response = await axios.get(`http://localhost:3000/api/accommodations/owner/${this.currentUser.id}`);
        this.ownerListings = response.data;
      } catch (err) {
        console.error('Error loading owner accommodations:', err);
      }
    },
    async loadPendingListings() {
      try {
        const response = await axios.get('http://localhost:3000/api/accommodations/pending');
        this.pendingListings = response.data;
      } catch (err) {
        console.error('Error loading pending accommodations:', err);
        this.adminAlert = 'Failed to load moderation queue.';
      }
    },
    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.uploadingImage = true;
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await axios.post('http://localhost:3000/api/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        this.accommodationForm.image_url = response.data.imageUrl;
        this.formAlert = '📸 Image uploaded successfully.';
      } catch (err) {
        console.error('Image upload failed:', err);
        this.formAlert = 'Failed to upload image.';
      } finally {
        this.uploadingImage = false;
      }
    },
    async submitAccommodation(formPayload) {
      this.formAlert = '';
      
      const payload = {
        ...formPayload,
        owner_id: this.currentUser.id || 1,
        status: 'pending'
      };

      try {
        const response = await axios.post('http://localhost:3000/api/accommodations', payload);

        this.ownerListings.unshift(response.data.accommodation);
        this.formAlert = '🎉 Property submission sent for admin approval.';
        this.accommodationForm = {
          title: '',
          address: '',
          property_type: 'rooms',
          unit_count: '',
          location: '',
          price_per_night: '',
          description: '',
          has_ac: false,
          has_parking: false,
          has_room_service: false,
          has_private_wc: false,
          image_url: ''
        };
      } catch (err) {
        console.error('Error submitting infrastructure resource configuration path:', err);
        this.formAlert = err.response?.data?.message || 'Failed to save accommodation.';
      }
    },
    async handleModeration({ id, status }) {
      this.adminAlert = '';
      this.processingIds = [...this.processingIds, id];

      try {
        await axios.patch(`http://localhost:3000/api/accommodations/${id}/status`, { status });
        this.adminAlert = `Listing ${status} successfully.`;
        this.pendingListings = this.pendingListings.filter((item) => item.id !== id);
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

