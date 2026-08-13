<template>
  <div>
    <!-- Global Student Navigation Header Bar -->
    <nav class="px-4 py-3 flex items-center gap-8 font-semibold shadow-md bg-[#1B5E20] text-white">
      <router-link to="/" class="flex items-center hover:opacity-90 transition" aria-label="Home Marketplace">
        <span class="inline-flex items-center justify-center rounded-full bg-white/10 backdrop-blur-[1px] px-2 py-1 shadow-sm border border-white/20">
          <img :src="logoUrl" alt="Chocó Andino logo" class="h-30 w-auto object-contain bg-transparent rounded-sm" />
        </span>
      </router-link>
      <router-link to="/login" class="hover:underline text-sm sm:text-base">Sign In / Register</router-link>
      <router-link to="/dashboard" class="hover:underline text-sm sm:text-base">My Dashboard</router-link>
    </nav>

    <!-- The dynamic viewing window where Vue Router switches your pages -->
    <router-view></router-view>
  </div>
</template>

<script>
const logoUrl = new URL('./images/white_logo.png', import.meta.url).href;

export default {
  data() {
    return {
      logoUrl
    };
  }
};
</script>

<style>
/* To acces to the style in main.css */
@import "./assets/main.css";
</style>

