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
        <span class="px-3 py-1 rounded-full bg-green-600 text-white text-[11px] font-bold uppercase tracking-wider">
          {{ pendingCount }} Pending
        </span>
        <p class="text-xs text-gray-500">Signed in as {{ currentUser.name }} ({{ currentUser.role }})</p>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          @click="$emit('status-change', option.value)"
          :class="[
            'px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition',
            selectedStatus === option.value
              ? 'bg-brand-medium text-white border-brand-medium'
              : 'bg-white text-brand-medium border-green-200 hover:bg-green-50'
          ]"
        >
          {{ option.label }}
        </button>
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
              <p class="text-xs text-gray-500 mt-2">Submitted by: {{ listing.owner_name || 'Unknown owner' }}<span v-if="listing.owner_email"> · {{ listing.owner_email }}</span></p>
              <p class="text-xs text-gray-500 mt-1">Owner ID: {{ listing.owner_id || 'N/A' }} · Units: {{ listing.unit_count || 0 }}</p>
              <p class="text-xs text-gray-500 mt-1">Submitted at: {{ formatDateTime(listing.created_at) }}</p>
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

      <div class="mt-8 border-t border-green-100 pt-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div>
            <h4 class="text-base font-bold text-brand-dark">User Account Management</h4>
            <p class="text-xs text-gray-500 mt-1">Admin-only controls for roles, status, and privacy cleanup.</p>
          </div>
          <button
            type="button"
            @click="loadAdminUsers"
            class="px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-green-200 bg-brand-bg text-brand-medium hover:bg-green-100 transition"
          >
            Refresh Users
          </button>
        </div>

        <div v-if="showDeleteConfirm" class="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p class="text-sm font-bold text-red-700">Delete this account?</p>
          <p class="mt-1 text-xs text-red-700">
            This anonymizes the user and preserves confirmed/completed bookings. This action cannot be undone.
          </p>
          <div class="mt-3 flex items-center gap-2">
            <button
              type="button"
              @click="confirmUserDelete"
              class="px-3 py-2 rounded-lg bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 transition"
            >
              Confirm delete
            </button>
            <button
              type="button"
              @click="cancelUserDelete"
              class="px-3 py-2 rounded-lg border border-red-200 bg-white text-red-700 text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>

        <div class="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div class="flex flex-col md:flex-row md:items-center gap-3 w-full md:max-w-xl">
            <input
              v-model="userSearch"
              type="text"
              placeholder="Search users by name or email"
              class="w-full md:max-w-md rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-gray-400 focus:outline-none focus:border-brand-medium"
            />
            <select
              v-model="userRoleFilter"
              class="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-medium"
            >
              <option value="all">All roles</option>
              <option value="visitor">Visitor</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
            <select
              v-model="userStatusFilter"
              class="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-medium"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-brand-medium">
            {{ filteredAdminUsers.length }} match{{ filteredAdminUsers.length === 1 ? '' : 'es' }}
          </span>
        </div>

        <div v-if="adminUsersLoading" class="text-sm text-gray-500">Loading users...</div>
        <div v-else-if="filteredAdminUsers.length === 0" class="text-sm text-gray-500">No users found.</div>
        <div v-else>
          <div v-if="selectedUserDetail" class="mb-4 rounded-xl border border-green-200 bg-brand-bg p-4">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="h-16 w-16 overflow-hidden rounded-full border border-green-200 bg-white shadow-sm">
                  <img
                    v-if="selectedUserDetail.profile_photo"
                    :src="selectedUserDetail.profile_photo.startsWith('http') ? selectedUserDetail.profile_photo : `http://localhost:3000${selectedUserDetail.profile_photo}`"
                    :alt="selectedUserDetail.name || 'User profile photo'"
                    class="h-full w-full object-cover"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center bg-green-100 text-sm font-bold text-brand-medium">
                    {{ getInitials(selectedUserDetail.name) }}
                  </div>
                </div>

                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-brand-medium">User details</p>
                  <h5 class="mt-1 text-lg font-bold text-brand-dark">{{ selectedUserDetail.name || 'Unknown user' }}</h5>
                  <p class="text-sm text-gray-600">{{ selectedUserDetail.email || 'No email provided' }}</p>
                </div>
              </div>

              <span
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  Number(selectedUserDetail.is_active) === 1
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                ]"
              >
                {{ Number(selectedUserDetail.is_active) === 1 ? 'active' : 'inactive' }}
              </span>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-4">
              <div class="rounded-lg border border-green-100 bg-white p-3">
                <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Role</p>
                <p class="mt-1 text-sm font-semibold text-brand-dark">{{ selectedUserDetail.role || 'visitor' }}</p>
              </div>
              <div class="rounded-lg border border-green-100 bg-white p-3">
                <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">User ID</p>
                <p class="mt-1 text-sm font-semibold text-brand-dark">{{ selectedUserDetail.id }}</p>
              </div>
              <div class="rounded-lg border border-green-100 bg-white p-3">
                <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Date of birth</p>
                <p class="mt-1 text-sm font-semibold text-brand-dark">{{ selectedUserDetail.date_of_birth ? formatDate(selectedUserDetail.date_of_birth) : 'Not provided' }}</p>
              </div>
              <div class="rounded-lg border border-green-100 bg-white p-3">
                <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Photo</p>
                <p class="mt-1 text-sm font-semibold text-brand-dark">{{ selectedUserDetail.profile_photo ? 'Available' : 'Not uploaded' }}</p>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-100 text-[11px] uppercase font-bold text-brand-medium tracking-wider">
                  <th class="pb-3">Name</th>
                  <th class="pb-3">Email</th>
                  <th class="pb-3">Role</th>
                  <th class="pb-3">Status</th>
                  <th class="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody class="text-sm font-medium text-gray-700 divide-y divide-gray-50">
                <tr
                  v-for="user in filteredAdminUsers"
                  :key="user.id"
                  @click="selectUser(user)"
                  :class="[
                    selectedUserDetail && Number(selectedUserDetail.id) === Number(user.id) ? 'bg-green-50' : '',
                    'cursor-pointer hover:bg-green-50 transition'
                  ]"
                >
                  <td class="py-3.5 font-semibold text-brand-dark">
                    <div class="flex items-center gap-2">
                      <span>{{ user.name || 'Unknown user' }}</span>
                      <span
                        v-if="isProtectedPrimaryAdmin(user)"
                        class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700"
                      >
                        Protected
                      </span>
                    </div>
                  </td>
                  <td class="py-3.5 text-gray-600">{{ user.email || 'No email' }}</td>
                  <td class="py-3.5">
                    <select
                      :value="user.role"
                      @change="changeUserRole(user.id, $event.target.value)"
                      class="rounded-lg border border-green-200 bg-white px-2 py-1.5 text-xs font-semibold text-brand-dark focus:outline-none focus:border-brand-medium"
                    >
                      <option value="visitor">visitor</option>
                      <option value="owner">owner</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td class="py-3.5">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        Number(user.is_active) === 1
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      ]"
                    >
                      {{ Number(user.is_active) === 1 ? 'active' : 'inactive' }}
                    </span>
                  </td>
                  <td class="py-3.5">
                    <div class="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        @click="toggleUserStatus(user)"
                        :disabled="isProtectedPrimaryAdmin(user)"
                        :class="[
                          'px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition',
                          isProtectedPrimaryAdmin(user)
                            ? 'border-amber-200 bg-amber-50 text-amber-600 cursor-not-allowed opacity-70'
                            : 'border-green-200 bg-brand-bg text-brand-medium hover:bg-green-100'
                        ]"
                      >
                        {{ Number(user.is_active) === 1 ? 'Disable' : 'Enable' }}
                      </button>
                      <button
                        type="button"
                        @click="requestUserDelete(user.id)"
                        :disabled="isProtectedPrimaryAdmin(user)"
                        :class="[
                          'px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition',
                          isProtectedPrimaryAdmin(user)
                            ? 'border-amber-200 bg-amber-50 text-amber-600 cursor-not-allowed opacity-70'
                            : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        ]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="mt-8 border-t border-green-100 pt-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div>
            <h4 class="text-base font-bold text-brand-dark">Monthly Revenue by Property</h4>
            <p class="text-xs text-gray-500 mt-1">Global reporting view across all owners.</p>
          </div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand-medium">{{ adminRevenueReport.length }} rows</span>
        </div>

        <div v-if="adminRevenueReport.length === 0" class="text-sm text-gray-500">No revenue records available yet.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-100 text-[11px] uppercase font-bold text-brand-medium tracking-wider">
                <th class="pb-3">Month</th>
                <th class="pb-3">Property</th>
                <th class="pb-3">Owner</th>
                <th class="pb-3">Bookings</th>
                <th class="pb-3">Confirmed</th>
                <th class="pb-3">Cancelled</th>
                <th class="pb-3">Declined</th>
                <th class="pb-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody class="text-sm font-medium text-gray-700 divide-y divide-gray-50">
              <tr v-for="row in adminRevenueReport" :key="`${row.report_month}-${row.property_id}-${row.owner_id}`">
                <td class="py-3.5 text-gray-600">{{ formatMonth(row.report_month) }}</td>
                <td class="py-3.5 font-semibold text-brand-dark">{{ row.property_title || ('Property #' + row.property_id) }}</td>
                <td class="py-3.5 text-gray-600">{{ row.owner_name || ('Owner #' + row.owner_id) }}</td>
                <td class="py-3.5 text-gray-600">{{ Number(row.total_bookings || 0) }}</td>
                <td class="py-3.5 text-green-700 font-semibold">{{ Number(row.confirmed_bookings || 0) }}</td>
                <td class="py-3.5 text-red-700 font-semibold">{{ Number(row.cancelled_bookings || 0) }}</td>
                <td class="py-3.5 text-amber-700 font-semibold">{{ Number(row.declined_bookings || 0) }}</td>
                <td class="py-3.5 text-right font-bold text-brand-dark">{{ formatCurrency(row.revenue_total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

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
    pendingCount: {
      type: Number,
      default: 0
    },
    adminRevenueReport: {
      type: Array,
      default: () => []
    },
    selectedStatus: {
      type: String,
      default: 'pending'
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
  emits: ['refresh', 'status-change', 'moderate'],
  data() {
    return {
      statusOptions: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'All', value: 'all' }
      ],
      adminUsers: [],
      adminUsersLoading: false,
      showDeleteConfirm: false,
      pendingDeleteUserId: null,
      userSearch: '',
      userRoleFilter: 'all',
      userStatusFilter: 'all',
      selectedUserId: null
    };
  },
  computed: {
    selectedUserDetail() {
      if (this.selectedUserId === null || this.selectedUserId === undefined) {
        return null;
      }

      const selectedId = Number(this.selectedUserId);
      if (!Number.isFinite(selectedId)) {
        return null;
      }

      return this.filteredAdminUsers.find((user) => Number(user.id) === selectedId) || null;
    },
    filteredAdminUsers() {
      const normalizeText = (value) => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
      const searchTerm = normalizeText(this.userSearch);

      return this.adminUsers.filter((user) => {
        const nameValue = String(user?.name || '');
        const emailValue = String(user?.email || '');

        if (nameValue.startsWith('Deleted User ') || emailValue.startsWith('deleted-')) {
          return false;
        }

        const matchesRole = this.userRoleFilter === 'all' || normalizeText(user.role) === this.userRoleFilter;
        const isActive = Number(user.is_active) === 1;
        const matchesStatus = this.userStatusFilter === 'all'
          || (this.userStatusFilter === 'active' && isActive)
          || (this.userStatusFilter === 'inactive' && !isActive);

        if (!matchesRole || !matchesStatus) {
          return false;
        }

        if (!searchTerm) {
          return true;
        }

        const name = normalizeText(user.name);
        const email = normalizeText(user.email);
        return name.includes(searchTerm) || email.includes(searchTerm);
      });
    }
  },
  mounted() {
    this.loadAdminUsers();
  },
  watch: {
    userSearch() {
      this.selectedUserId = null;
    },
    userRoleFilter() {
      this.selectedUserId = null;
    },
    userStatusFilter() {
      this.selectedUserId = null;
    },
    filteredAdminUsers() {
      if (!this.userSearch || !this.userSearch.trim()) {
        this.selectedUserId = null;
      }
    },
    adminUsers: {
      handler() {
        if (!this.selectedUserId) {
          return;
        }

        const selectedStillExists = this.adminUsers.some((user) => Number(user.id) === Number(this.selectedUserId));
        if (!selectedStillExists) {
          this.selectedUserId = null;
        }
      },
      deep: true
    }
  },
  methods: {
    getAdminToken() {
      return localStorage.getItem('userToken');
    },
    getInitials(name) {
      const safeName = String(name || '').trim();
      if (!safeName) {
        return 'U';
      }

      return safeName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
    },
    selectUser(user) {
      if (!user) {
        return;
      }

      this.selectedUserId = Number(user.id);
    },
    clearUserSelection() {
      this.selectedUserId = null;
    },
    formatDate(value) {
      if (!value) {
        return 'Not provided';
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    },
    isProtectedPrimaryAdmin(user) {
      return Number(user?.id) === 10 && String(user?.role || '').toLowerCase() === 'admin';
    },
    async loadAdminUsers() {
      const token = this.getAdminToken();
      const role = String(this.currentUser?.role || '').toLowerCase();

      console.log('Admin user debug', {
        role,
        hasToken: !!token,
        userData: this.currentUser
      });

      if (!token || role !== 'admin') {
        this.adminUsers = [];
        this.adminAlert = role !== 'admin'
          ? 'Admin access required to load user list.'
          : 'Authentication token missing. Please sign in again.';
        return;
      }

      this.adminUsersLoading = true;

      try {
        const response = await axios.get('http://localhost:3000/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        this.adminUsers = response.data || [];
        this.clearUserSelection();
      } catch (error) {
        console.error('Error loading admin users:', error);
        this.adminUsers = [];
        this.adminAlert = error.response?.data?.message || 'Failed to load user list.';
      } finally {
        this.adminUsersLoading = false;
      }
    },
    async changeUserRole(userId, nextRole) {
      if (!nextRole) {
        return;
      }

      const token = this.getAdminToken();
      if (!token) {
        return;
      }

      try {
        await axios.patch(
          `http://localhost:3000/api/admin/users/${userId}/role`,
          { role: nextRole },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        this.adminAlert = `User role updated to ${nextRole}.`;
        await this.loadAdminUsers();
      } catch (error) {
        console.error('Error updating user role:', error);
        this.adminAlert = error.response?.data?.message || 'Failed to update user role.';
      }
    },
    async toggleUserStatus(user) {
      if (this.isProtectedPrimaryAdmin(user)) {
        this.adminAlert = 'The primary admin account cannot be disabled or enabled.';
        return;
      }

      const token = this.getAdminToken();
      if (!token) {
        return;
      }

      const nextStatus = Number(user.is_active) === 1 ? 0 : 1;

      try {
        await axios.patch(
          `http://localhost:3000/api/admin/users/${user.id}/status`,
          { is_active: nextStatus },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        this.adminAlert = `User account ${nextStatus === 1 ? 'enabled' : 'disabled'} successfully.`;
        await this.loadAdminUsers();
      } catch (error) {
        console.error('Error updating user status:', error);
        this.adminAlert = error.response?.data?.message || 'Failed to update user status.';
      }
    },
    requestUserDelete(userId) {
      const user = this.adminUsers.find((entry) => Number(entry.id) === Number(userId));

      if (this.isProtectedPrimaryAdmin(user)) {
        this.adminAlert = 'The primary admin account cannot be deleted.';
        return;
      }

      this.pendingDeleteUserId = userId;
      this.showDeleteConfirm = true;
    },
    cancelUserDelete() {
      this.pendingDeleteUserId = null;
      this.showDeleteConfirm = false;
    },
    async confirmUserDelete() {
      const userId = this.pendingDeleteUserId;
      const token = this.getAdminToken();
      if (!token || !userId) {
        this.cancelUserDelete();
        return;
      }

      try {
        const response = await axios.delete(
          `http://localhost:3000/api/admin/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        this.adminAlert = response.data.message || 'User account removed.';
        await this.loadAdminUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        this.adminAlert = error.response?.data?.message || 'Failed to remove user account.';
      } finally {
        this.cancelUserDelete();
      }
    },
    formatDateTime(value) {
      if (!value) {
        return 'Unknown';
      }

      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(value));
    },
    formatMonth(value) {
      if (!value) {
        return 'Unknown';
      }

      const parsed = new Date(`${value}-01T00:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        return String(value);
      }

      return new Intl.DateTimeFormat('en-GB', {
        month: 'long',
        year: 'numeric'
      }).format(parsed);
    },
    formatCurrency(value) {
      const amount = Number(value || 0);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2
      }).format(amount);
    }
  }
};
</script>
