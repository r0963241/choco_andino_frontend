<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
      <h3 class="text-lg font-bold text-brand-dark mt-0">Your Wilderness Itinerary</h3>
      <p class="text-sm text-gray-500 mt-1">Review your verified reserve stays and active ecotourism bookings.</p>
      <div class="mt-6 border border-dashed border-green-200 p-8 text-center rounded-xl bg-brand-bg text-brand-medium text-sm font-medium">
        🍃 No immediate exploration bookings found. Head to the Home Marketplace to schedule a stay.
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
    }
  }
};
</script>
