<template>
  <div class="min-h-screen bg-brand-bg text-[#333] font-sans">
    
    <!-- 1. VIDEO-STYLE HERO IMMERSION BANNER (VIDEO BACKDROP EDITION) -->
    <header class="relative w-full h-[75vh] bg-neutral-900 overflow-hidden flex items-center justify-center text-center px-4">
      
      <!-- Local Video Loop-->
      <video 
        autoplay 
        loop 
        muted 
        playsinline 
        class="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none"
      >
        <source :src="videoUrl" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <!-- Text Content Overlay Panel -->
      <div class="relative z-10 max-w-3xl fade-in-tab pt-8 md:pt-12">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white font-sans tracking-tight mt-0 drop-shadow-md">
          A Rainforest Hotel In The Clouds
        </h1>
        <p class="text-white/90 text-base md:text-lg mt-4 max-w-2xl mx-auto drop-shadow font-sans">
          Nestled inside the biodiverse Chocó Andino private reserve. Encounter otherworldly flora, 
          cascading waterfalls, and extraordinary creatures exclusive to our planet.
        </p>
      </div>
    </header>

    <!-- 2. SUSTAINABILITY & MISSION SECTION -->
    <section class="max-w-4xl mx-auto px-6 pt-16 pb-8 text-center">
      <h2 class="text-3xl font-bold font-sans text-brand-dark mt-0 mb-4">Regenerative Tourism & Conservation</h2>
      <p class="text-gray-600 text-base leading-relaxed font-sans max-w-3xl mx-auto">
        Dedicated to promoting wellbeing, conservation, and community development in the Andean Chocó region. 
        Every visit minimizes impact, funds internal scientific research, and actively improves the ecosystem, 
        leaving the cloud forest in better shape than we found it.
      </p>
      <div class="w-16 h-1 bg-brand-medium mx-auto mt-6 rounded"></div>
    </section>

    <!-- 3. CORE MARKETPLACE DISCOVERY SECTION -->
    <main class="max-w-7xl mx-auto px-6 py-12">
      <div class="text-center mb-10">
        <h2 class="text-2xl font-bold font-sans text-brand-dark mt-0">Explore Accommodations</h2>
        <p class="text-sm text-gray-500 font-sans mt-1">Tranquil sanctuaries integrating modern comforts with pristine wilderness.</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center p-12 text-gray-500 font-medium fade-in-tab">
        <span class="inline-block animate-spin mr-2">🍃</span> Gathering local reserve cabins...
      </div>

      <!-- INVENTORY GRID LAYOUT -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div 
          v-for="cabin in accommodations" 
          :key="cabin.id" 
          class="bg-white rounded-xl overflow-hidden shadow-sm border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
        >
          <!-- Floating Location Banner Card -->
          <div class="relative h-56 bg-neutral-100 overflow-hidden">
            <img 
              :src="cabin.image_url || '/cabin2.jpg'" 
              :alt="cabin.title"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <span class="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm text-brand-dark px-3 py-1 rounded shadow-sm">
              📍 {{ cabin.location }}
            </span>
          </div>
          
          <!-- Card Details Area -->
          <div class="p-6 flex flex-col flex-grow">
            <h3 class="text-xl font-bold font-sans text-brand-dark mt-0 mb-2">
              {{ cabin.title }}
            </h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
              {{ cabin.description }}
            </p>
            
            <!-- Price and Action Row -->
            <div class="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
              <div>
                <span class="text-2xl font-extrabold text-brand-medium tracking-tight">${{ cabin.price_per_night }}</span>
                <span class="text-xs text-gray-400 font-medium"> / night</span>
              </div>
              
              <button 
                @click="bookAccommodation(cabin.id)" 
                class="px-5 py-2.5 bg-brand-dark hover:bg-brand-medium text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors duration-300 shadow-sm"
              >
                Book Stay
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 4. CLEAN ECOLOGICAL FOOTER ELEMENT -->
    <footer class="bg-brand-dark text-white/80 text-center py-8 border-t border-green-800 text-xs tracking-wider font-sans">
      <p>© 2026 El Chocó Andino Private Reserve Platform. All Rights Reserved.</p>
    </footer>
  </div>
</template>

<script>
import axios from 'axios';

const videoUrl = new URL('../videos/mindo-realistic-video-home.mp4', import.meta.url).href;
const homeLogoUrl = new URL('../images/logo_3.jpg', import.meta.url).href;

export default {
  data() {
    return {
      accommodations: [],
      loading: true,
      videoUrl,
      homeLogoUrl
    };
  },
  async created() {
    try {
      const response = await axios.get('http://localhost:3000/api/accommodations');
      this.accommodations = response.data;
    } catch (error) {
      console.error('Error fetching marketplace inventory:', error);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    bookAccommodation(id) {
      const token = localStorage.getItem('userToken');
      if (!token) {
        alert('⚠️ Booking requires secure profile verification. Redirecting to access panel...');
        this.$router.push('/login');
      } else {
        alert(`🎉 Exploration request registered for accommodation ID: ${id}!`);
      }
    }
  }
};
</script>

