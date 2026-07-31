<template>
  <div class="p-8">
    <!-- Headers matching my dark green accents -->
    <h1>El Chocó Andino Marketplace</h1>
    <h2 class="mt-2 mb-8">Discover Sustainable Eco-Accommodations</h2>

    <!-- Loading State Alert Box -->
    <div v-if="loading" class="text-center p-6 text-gray-500 font-medium">
      🍃 Gathering local cabins from the cloud forest...
    </div>

    <!-- Accommodations Responsive Card Grid Layout -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="cabin in accommodations" 
        :key="cabin.id" 
        class="bg-white rounded-xl shadow-md border border-green-100 overflow-hidden hover:shadow-lg transition duration-300"
      >
        <!-- Card Text Content Area -->
        <div class="p-6">
          <span class="text-xs font-bold uppercase tracking-wide text-[#2E7D32] bg-green-50 px-2.5 py-1 rounded-full">
            {{ cabin.location }}
          </span>
          
          <h3 class="text-xl font-bold mt-3 mb-2">{{ cabin.title }}</h3>
          <p class="text-gray-600 text-sm line-clamp-3 mb-4">{{ cabin.description }}</p>
          
          <!-- Price and Actions Alignment Bar -->
          <div class="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
            <div>
              <span class="text-2xl font-extrabold text-[#1B5E20]">${{ cabin.price_per_night }}</span>
              <span class="text-xs text-gray-500 font-medium"> / night</span>
            </div>
            
            <button @click="bookAccommodation(cabin.id)" class="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-sm font-bold rounded-lg transition shadow">
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export default {
  data() {
    return {
      accommodations: [],
      loading: true
    };
  },
  async created() {
    // Automatically runs when the page loads to pull data from your backend
    try {
      const response = await axios.get(`${API_BASE_URL}/api/accommodations`);
      this.accommodations = response.data;
    } catch (error) {
      console.error('Error fetching marketplace inventory:', error);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    bookAccommodation(id) {
      // Basic validation: Check if user is logged in before booking
      const token = localStorage.getItem('userToken');
      if (!token) {
        alert('⚠️ You must log in first to book local accommodations.');
        this.$router.push('/login');
      } else {
        alert(`🎉 Booking request submitted for accommodation ID: ${id}! We will hook up this endpoint next.`);
      }
    }
  }
};
</script>

