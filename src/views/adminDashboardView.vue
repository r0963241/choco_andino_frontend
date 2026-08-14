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
        <div v-else class="overflow-x-auto">
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
              <tr v-for="user in filteredAdminUsers" :key="user.id">
                <td class="py-3.5 font-semibold text-brand-dark">{{ user.name || 'Unknown user' }}</td>
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
                      class="px-2.5 py-1.5 rounded-lg border border-green-200 bg-brand-bg text-[10px] font-bold uppercase tracking-wider text-brand-medium hover:bg-green-100 transition"
                    >
                      {{ Number(user.is_active) === 1 ? 'Disable' : 'Enable' }}
                    </button>
                    <button
                      type="button"
                      @click="requestUserDelete(user.id)"
                      class="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-[10px] font-bold uppercase tracking-wider text-red-700 hover:bg-red-100 transition"
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
      userStatusFilter: 'all'
    };
  },
  computed: {
    filteredAdminUsers() {
      const searchTerm = this.userSearch.trim().toLowerCase();

      return this.adminUsers.filter((user) => {
        const matchesRole = this.userRoleFilter === 'all' || String(user.role || '').toLowerCase() === this.userRoleFilter;
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

        const name = String(user.name || '').toLowerCase();
        const email = String(user.email || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
      });
    }
  },
  mounted() {
    this.loadAdminUsers();
  },
  methods: {
    getAdminToken() {
      return localStorage.getItem('userToken');
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
