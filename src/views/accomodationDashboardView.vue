<template>
  <div class="space-y-6">
    <div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm backdrop-blur-md bg-white/95">
      <h3 class="text-lg font-bold text-brand-dark mt-0 mb-1">Accommodation Dashboard</h3>
      <p class="text-xs text-gray-500 mb-4">Create each room or cabin under an approved parent property.</p>

      <div v-if="approvedProperties.length === 0" class="p-4 rounded-xl border border-dashed border-amber-200 bg-amber-50 text-amber-800 text-sm">
        Your accommodation form unlocks after at least one property is approved by the admin.
      </div>

      <form v-else @submit.prevent="submitAccommodationForm" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Parent Property</label>
          <select v-model="accommodationForm.property_id" class="choco-input text-sm" required>
            <option disabled value="">Select an approved property</option>
            <option v-for="property in approvedProperties" :key="property.id" :value="String(property.id)">
              {{ property.title }}
            </option>
          </select>
        </div>

        <div v-if="selectedProperty" class="p-4 rounded-xl border border-green-100 bg-brand-bg/60 space-y-2 text-sm">
          <p class="font-bold text-brand-dark">Parent Property Details</p>
          <p><span class="font-semibold">Name:</span> {{ selectedProperty.title }}</p>
          <p><span class="font-semibold">Address:</span> {{ selectedProperty.address || 'Not provided' }}</p>
          <p><span class="font-semibold">Property Type:</span> {{ selectedProperty.property_type || 'Not provided' }}</p>
          <p><span class="font-semibold">Location:</span> {{ selectedProperty.location }}</p>
          <p><span class="font-semibold">Description:</span> {{ selectedProperty.description }}</p>
          <p><span class="font-semibold">Price Per Night:</span> {{ parentPriceLabel }}</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Accommodation Name</label>
          <input v-model="accommodationForm.title" type="text" placeholder="e.g., Forest Cabin 01" class="choco-input text-sm" required />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Accommodation Type</label>
            <select v-model="accommodationForm.accommodation_type" class="choco-input text-sm" required>
              <option value="room">Room</option>
              <option value="cabin">Cabin</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Bed Type</label>
            <select v-model="accommodationForm.bed_type" class="choco-input text-sm" required>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Max Adults</label>
            <input v-model.number="accommodationForm.max_adults" type="number" min="0" :max="accommodationRules.maxAdults" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Max Kids</label>
            <input v-model.number="accommodationForm.max_kids" type="number" min="0" :max="accommodationRules.maxKids" class="choco-input text-sm" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Max Babies</label>
            <input v-model.number="accommodationForm.max_babies" type="number" min="0" :max="accommodationRules.maxBabies" class="choco-input text-sm" required />
          </div>
        </div>
        <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
          <p class="font-semibold text-brand-dark">Occupancy Rules</p>
          <p>{{ accommodationRuleMessage }}</p>
          <p>Total guests configured: {{ accommodationGuestTotal }} / {{ accommodationRules.maxGuests }}</p>
          <p>Adults are considered from 13 years old. Kids are 3-12 years old. Babies are under 3 years old.</p>
        </div>
        <div>
          <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Price Per Night (€)</label>
          <input v-model.number="accommodationForm.price_per_night" type="number" min="1" placeholder="85" class="choco-input text-sm" required />
        </div>
        <div>
          <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Accommodation Description</label>
          <textarea v-model="accommodationForm.description" rows="3" placeholder="Describe this room or cabin..." class="choco-input text-sm resize-none" required></textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-brand-dark uppercase tracking-wide mb-1">Upload Accommodation Image</label>
          <input ref="accommodationImageInput" type="file" accept="image/*" @change="handleImageUpload('accommodation', $event)" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-bg file:text-brand-medium hover:file:bg-green-100" />
          <p v-if="uploadingTarget === 'accommodation'" class="text-xs text-brand-medium mt-2">Uploading image...</p>
        </div>
        <div v-if="accommodationForm.image_url" class="text-xs text-brand-medium">
          Selected image: {{ accommodationForm.image_url }}
        </div>

        <button type="submit" class="choco-btn-primary text-xs uppercase tracking-wider py-2.5">
          Save Accommodation
        </button>
      </form>

      <p v-if="accommodationAlert" class="mt-4 text-xs font-semibold p-2.5 bg-brand-bg text-brand-medium border border-green-100 rounded-lg text-center">
        {{ accommodationAlert }}
      </p>
    </div>

    <div class="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
      <h3 class="text-lg font-bold text-brand-dark mt-0 mb-4">Your Accommodations</h3>
      <div v-if="ownerAccommodations.length === 0" class="text-sm text-gray-500">No accommodations created yet.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-100 text-[11px] uppercase font-bold text-brand-medium tracking-wider">
              <th class="pb-3">Accommodation</th>
              <th class="pb-3">Parent Property</th>
              <th class="pb-3">Type</th>
              <th class="pb-3">Occupancy</th>
              <th class="pb-3">Price</th>
            </tr>
          </thead>
          <tbody class="text-sm font-medium text-gray-700 divide-y divide-gray-50">
            <tr v-for="item in ownerAccommodations" :key="item.id">
              <td class="py-3.5 font-bold text-brand-dark">{{ item.title }}</td>
              <td class="py-3.5 text-gray-600">{{ item.property_name || 'Unknown property' }}</td>
              <td class="py-3.5 text-gray-500 capitalize">{{ item.accommodation_type }} / {{ item.bed_type }}</td>
              <td class="py-3.5 text-gray-600">{{ item.max_adults }} adults, {{ item.max_kids }} kids, {{ item.max_babies }} babies</td>
              <td class="py-3.5 text-brand-medium font-bold">€{{ item.price_per_night }}</td>
            </tr>
          </tbody>
        </table>
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
    ownerProperties: {
      type: Array,
      default: () => []
    },
    ownerAccommodations: {
      type: Array,
      default: () => []
    },
    accommodationAlert: {
      type: String,
      default: ''
    },
    accommodationUploadedImageUrl: {
      type: String,
      default: ''
    },
    accommodationFormResetKey: {
      type: Number,
      default: 0
    },
    uploadingTarget: {
      type: String,
      default: ''
    }
  },
  emits: ['submit-accommodation', 'image-upload'],
  data() {
    return {
      accommodationForm: this.getInitialAccommodationForm()
    };
  },
  watch: {
    accommodationUploadedImageUrl(newValue) {
      this.accommodationForm.image_url = newValue || '';
    },
    accommodationFormResetKey() {
      this.resetAccommodationForm();
    },
    approvedProperties: {
      immediate: true,
      handler(newValue) {
        if (!newValue.length) {
          this.accommodationForm.property_id = '';
          return;
        }

        const propertyStillExists = newValue.some((item) => String(item.id) === String(this.accommodationForm.property_id));
        if (!propertyStillExists) {
          this.accommodationForm.property_id = String(newValue[0].id);
        }
      }
    },
    'accommodationForm.accommodation_type'() {
      this.normalizeAccommodationOccupancy();
    },
    'accommodationForm.bed_type'() {
      this.normalizeAccommodationOccupancy();
    }
  },
  computed: {
    approvedProperties() {
      return this.ownerProperties.filter((item) => item.status === 'approved');
    },
    selectedProperty() {
      return this.approvedProperties.find((item) => String(item.id) === String(this.accommodationForm.property_id)) || null;
    },
    accommodationRules() {
      if (this.accommodationForm.accommodation_type === 'cabin') {
        if (this.accommodationForm.bed_type === 'triple') {
          return { maxAdults: 3, maxKids: 2, maxBabies: 3, maxGuests: 8, combinedKidsBabiesLimit: 5 };
        }

        return { maxAdults: 2, maxKids: 2, maxBabies: 2, maxGuests: 6, combinedKidsBabiesLimit: 4 };
      } else {
        if (this.accommodationForm.bed_type === 'single') {
          return { maxAdults: 1, maxKids: 1, maxBabies: 1, maxGuests: 1, combinedKidsBabiesLimit: 0 };
        }

        if (this.accommodationForm.bed_type === 'double') {
          return { maxAdults: 2, maxKids: 2, maxBabies: 2, maxGuests: 6, combinedKidsBabiesLimit: 4 };
        }

        return { maxAdults: 3, maxKids: 3, maxBabies: 2, maxGuests: 8, combinedKidsBabiesLimit: 5 };
      }
    },
    accommodationGuestTotal() {
      return Number(this.accommodationForm.max_adults || 0) + Number(this.accommodationForm.max_kids || 0) + Number(this.accommodationForm.max_babies || 0);
    },
    accommodationRuleMessage() {
      if (this.accommodationForm.accommodation_type === 'cabin') {
        if (this.accommodationForm.bed_type === 'triple') {
          return 'Triple cabins can host up to 3 adults, 2 kids, and 3 babies.';
        }

        return 'Cabins can host up to 2 adults, 2 kids, and 2 babies.';
      } else {
        if (this.accommodationForm.bed_type === 'double') {
          return 'Double rooms allow up to 2 adults plus either 2 kids, or 1 kid + 1 baby, or 2 babies.';
        }

        if (this.accommodationForm.bed_type === 'single') {
          return 'Single rooms allow 1 adult only.';
        }

        return 'Triple rooms allow up to 3 adults.';
      }
    },
    parentPriceLabel() {
      if (!this.selectedProperty) {
        return 'Select a property first';
      }

      return Number(this.selectedProperty.price_per_night) > 0
        ? `Legacy base price €${this.selectedProperty.price_per_night}`
        : 'Set per accommodation below';
    }
  },
  methods: {
    getInitialAccommodationForm() {
      return {
        property_id: '',
        title: '',
        accommodation_type: 'room',
        bed_type: 'single',
        max_adults: 1,
        max_kids: 0,
        max_babies: 0,
        price_per_night: '',
        description: '',
        image_url: ''
      };
    },
    resetAccommodationForm() {
      this.accommodationForm = {
        ...this.getInitialAccommodationForm(),
        property_id: this.approvedProperties[0] ? String(this.approvedProperties[0].id) : ''
      };
      if (this.$refs.accommodationImageInput) {
        this.$refs.accommodationImageInput.value = '';
      }
    },
    normalizeAccommodationOccupancy() {
      const rules = this.accommodationRules;
      this.accommodationForm.max_adults = Math.min(Number(this.accommodationForm.max_adults || 0), rules.maxAdults);
      this.accommodationForm.max_kids = Math.min(Number(this.accommodationForm.max_kids || 0), rules.maxKids);
      this.accommodationForm.max_babies = Math.min(Number(this.accommodationForm.max_babies || 0), rules.maxBabies);

      if ((this.accommodationForm.max_kids + this.accommodationForm.max_babies) > rules.combinedKidsBabiesLimit) {
        this.accommodationForm.max_babies = Math.max(0, rules.combinedKidsBabiesLimit - this.accommodationForm.max_kids);
      }
    },
    submitAccommodationForm() {
      this.normalizeAccommodationOccupancy();

      if (this.accommodationGuestTotal === 0 || this.accommodationGuestTotal > this.accommodationRules.maxGuests) {
        return;
      }

      this.$emit('submit-accommodation', {
        ...this.accommodationForm,
        property_id: Number(this.accommodationForm.property_id),
        owner_id: this.currentUser.id || 1,
        status: 'approved'
      });
    },
    handleImageUpload(target, event) {
      this.$emit('image-upload', { target, event });
    }
  }
};
</script>