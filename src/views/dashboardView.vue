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
</template>
