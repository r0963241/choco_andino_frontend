<template>
  <div>
    <!-- Global Student Navigation Header Bar -->
    <nav class="p-4 flex gap-6 font-semibold shadow-md bg-[#1B5E20] text-white">
      <router-link to="/" class="hover:underline">Home Marketplace</router-link>
      <router-link to="/login" class="hover:underline">Sign In / Register</router-link>
      <router-link to="/dashboard" class="hover:underline">My Dashboard</router-link>
    </nav>

    <!-- The dynamic viewing window where Vue Router switches your pages -->
    <router-view></router-view>
  </div>
</template>

<style>
/* Make sure our main stylesheet is mounted globally */
@import "./assets/main.css";
</style>

