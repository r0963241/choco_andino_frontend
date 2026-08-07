<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
      <h3 class="text-lg font-bold text-brand-dark mt-0">Global Ecosystem Moderation</h3>
      <p class="text-sm text-gray-500 mt-1">Audit profile roles and grant compliance clearance approvals for eco-listings.</p>
      <div class="mt-4 flex items-center gap-3">
        <button
          @click="$emit('refresh')"
          class="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-green-200 bg-brand-bg text-brand-medium hover:bg-green-100 transition"
        >
          Refresh Queue
        </button>
        <p class="text-xs text-gray-500">Signed in as {{ currentUser.name }} ({{ currentUser.role }})</p>
      </div>

      <p
        v-if="adminAlert"
        class="mt-4 text-xs font-semibold p-2.5 rounded-lg border"
        :class="adminAlert.toLowerCase().includes('failed') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'"
      >
        {{ adminAlert }}
      </p>

      <div v-if="pendingListings.length === 0" class="mt-6 border border-dashed border-green-200 p-8 text-center rounded-xl bg-brand-bg text-brand-dark text-sm font-medium">
        ⚖️ System queue clear. All local accommodation resources are perfectly synced to current security standards.
      </div>

      <div v-else class="mt-6 space-y-4">
        <article
          v-for="listing in pendingListings"
          :key="listing.id"
          class="border border-green-100 rounded-xl p-4 bg-[#fbfffb]"
        >
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h4 class="text-base font-bold text-brand-dark">{{ listing.title }}</h4>
              <p class="text-sm text-gray-500 mt-1">{{ listing.location }} · {{ listing.property_type || 'property' }}</p>
              <p class="text-xs text-gray-500 mt-2">Owner ID: {{ listing.owner_id || 'N/A' }} · Units: {{ listing.unit_count || 0 }}</p>
              <p class="text-sm text-gray-700 mt-3">{{ listing.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="$emit('moderate', { id: listing.id, status: 'approved' })"
                :disabled="processingIds.includes(listing.id)"
                class="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-green-600 bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                @click="$emit('moderate', { id: listing.id, status: 'rejected' })"
                :disabled="processingIds.includes(listing.id)"
                class="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        </article>
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
    },
    pendingListings: {
      type: Array,
      default: () => []
    },
    adminAlert: {
      type: String,
      default: ''
    },
    processingIds: {
      type: Array,
      default: () => []
    }
  },
  emits: ['refresh', 'moderate']
};
</script>
