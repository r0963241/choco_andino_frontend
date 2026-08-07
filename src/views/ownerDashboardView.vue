<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-1 space-y-6">
      <div
        class="p-4 rounded-xl border text-sm"
        :class="hasApprovedListings ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'"
      >
        <p class="font-bold">
          {{ hasApprovedListings ? 'Approval granted. Owner tools unlocked.' : 'Waiting for admin approval.' }}
        </p>
        <p class="mt-1">
          {{ hasApprovedListings
            ? 'You can continue adding and managing accommodations. New submissions will still be moderated.'
            : 'Your property request is pending review. Once approved by admin, you can manage accommodations fully.' }}
        </p>
      </div>

      <div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm backdrop-blur-md bg-white/95">
        <h3 class="text-lg font-bold text-brand-dark mt-0 mb-1">Register a New Property</h3>
        <p class="text-xs text-gray-500 mb-4">Submit a new property and define how many accommodations it contains for admin review.</p>

        <form @submit.prevent="submitForm" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Property Name</label>
            <input v-model="form.title" type="text" placeholder="e.g., Mindo Hummingbird Pod" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Address</label>
            <input v-model="form.address" type="text" placeholder="e.g., Quito - Mindo Road 12" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Property Type</label>
            <select v-model="form.property_type" class="choco-input text-sm" required>
              <option value="rooms">Rooms</option>
              <option value="cabins">Cabins</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Number of Accommodations</label>
            <input v-model="form.unit_count" type="number" placeholder="4" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Location Zone</label>
            <input v-model="form.location" type="text" placeholder="e.g., Mindo Reserve" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Price Per Night (€)</label>
            <input v-model="form.price_per_night" type="number" placeholder="85" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Sanctuary Description</label>
            <textarea v-model="form.description" rows="3" placeholder="Describe the physical immersion context details..." class="choco-input text-sm resize-none" required></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <label class="flex items-center gap-2"><input type="checkbox" v-model="form.has_ac" /> AC / Radiator</label>
            <label class="flex items-center gap-2"><input type="checkbox" v-model="form.has_parking" /> Parking</label>
            <label class="flex items-center gap-2"><input type="checkbox" v-model="form.has_room_service" /> Room Service</label>
            <label class="flex items-center gap-2"><input type="checkbox" v-model="form.has_private_wc" /> Private WC</label>
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Upload Image</label>
            <input type="file" accept="image/*" @change="handleImageUpload" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-bg file:text-brand-medium hover:file:bg-green-100" />
            <p v-if="uploadingImage" class="text-xs text-brand-medium mt-2">Uploading image...</p>
          </div>
          <div v-if="form.image_url" class="text-xs text-brand-medium">
            Selected image: {{ form.image_url }}
          </div>

          <button type="submit" class="choco-btn-primary text-xs uppercase tracking-wider py-2.5">
            Submit for Approval
          </button>
        </form>

        <p v-if="formAlert" class="mt-4 text-xs font-semibold p-2.5 bg-brand-bg text-brand-medium border border-green-100 rounded-lg text-center">
          {{ formAlert }}
        </p>
      </div>
    </div>

    <div class="lg:col-span-2 space-y-6">
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-center">
          <span class="block text-2xl font-black text-brand-dark">{{ approvedCount }}</span>
          <span class="text-[10px] uppercase font-bold text-brand-medium tracking-wider">Approved Listings</span>
        </div>
        <div class="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-center">
          <span class="block text-2xl font-black text-brand-dark">{{ pendingCount }}</span>
          <span class="text-[10px] uppercase font-bold text-brand-medium tracking-wider">Pending Review</span>
        </div>
        <div class="bg-white p-4 rounded-xl border border-green-100 shadow-sm text-center">
          <span class="block text-2xl font-black" :class="hasApprovedListings ? 'text-green-700' : 'text-amber-600'">{{ hasApprovedListings ? 'Unlocked' : 'Locked' }}</span>
          <span class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Owner Tools</span>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
        <h3 class="text-lg font-bold text-brand-dark mt-0 mb-4">Your Property Submissions</h3>
        <div v-if="ownerListings.length === 0" class="text-sm text-gray-500">No submissions yet.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-100 text-[11px] uppercase font-bold text-brand-medium tracking-wider">
                <th class="pb-3">Property Name</th>
                <th class="pb-3">Location</th>
                <th class="pb-3">Accommodations</th>
                <th class="pb-3">Base Price</th>
                <th class="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="text-sm font-medium text-gray-700 divide-y divide-gray-50">
              <tr v-for="item in ownerListings" :key="item.id">
                <td class="py-3.5 font-bold text-brand-dark">{{ item.title }}</td>
                <td class="py-3.5 text-gray-500">{{ item.location }}</td>
                <td class="py-3.5 text-gray-600">{{ item.unit_count || 0 }}</td>
                <td class="py-3.5 text-brand-medium font-bold">${{ item.price_per_night }}</td>
                <td class="py-3.5 text-right">
                  <span class="px-2 py-0.5 bg-brand-bg text-brand-medium border border-green-100 text-[10px] font-bold uppercase rounded">
                    {{ item.status || 'pending' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
    ownerListings: {
      type: Array,
      default: () => []
    },
    formAlert: {
      type: String,
      default: ''
    },
    accommodationForm: {
      type: Object,
      default: () => ({})
    },
    uploadingImage: {
      type: Boolean,
      default: false
    }
  },
  emits: ['submit', 'image-upload', 'logout'],
  data() {
    return {
      form: {
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
      }
    };
  },
  watch: {
    accommodationForm: {
      immediate: true,
      deep: true,
      handler(newValue) {
        this.form = { ...this.form, ...newValue };
      }
    }
  },
  computed: {
    approvedCount() {
      return this.ownerListings.filter((item) => item.status === 'approved').length;
    },
    pendingCount() {
      return this.ownerListings.filter((item) => item.status === 'pending').length;
    },
    hasApprovedListings() {
      return this.approvedCount > 0;
    }
  },
  methods: {
    submitForm() {
      this.$emit('submit', {
        ...this.form,
        owner_id: this.currentUser.id || 1,
        status: 'pending'
      });
    },
    handleImageUpload(event) {
      this.$emit('image-upload', event);
    }
  }
};
</script>
