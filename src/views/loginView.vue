<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="choco-card">
      
      <h1>El Chocó Andino</h1>
      <h2 class="text-center mb-6">Ecotourism Ecosystem</h2>

      <!-- Tab Buttons Header -->
      <div class="flex border-b-2 border-gray-200 mb-6">
        <button 
          @click="activeTab = 'login'" 
          :class="['choco-tab-btn', { 'choco-tab-btn-active': activeTab === 'login' }]"
        >
          Sign In
        </button>
        <button 
          @click="activeTab = 'register'" 
          :class="['choco-tab-btn', { 'choco-tab-btn-active': activeTab === 'register' }]"
        >
          Register
        </button>
      </div>

      <!-- Tab Content Area with Custom Fade-In Class -->
      <div class="fade-in-tab">
        
        <!-- SIGN IN VIEW -->
        <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input v-model="loginForm.email" type="email" class="choco-input" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input v-model="loginForm.password" type="password" class="choco-input" />
          </div>
          <button type="submit" class="choco-btn-primary">Log In</button>
        </form>

        <!-- REGISTRATION VIEW -->
        <form v-if="activeTab === 'register'" @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input v-model="registerForm.name" type="text" class="choco-input" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input v-model="registerForm.email" type="email" class="choco-input" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input v-model="registerForm.password" type="password" class="choco-input" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
            <input v-model="registerForm.date_of_birth" type="date" class="choco-input" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Account Role Type</label>
            <select v-model="registerForm.role" class="choco-input bg-white">
              <option value="visitor">Visitor (I want to book cabins)</option>
              <option value="owner">Local Owner (I manage B&Bs/products)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" class="choco-btn-primary">Create Account</button>
        </form>

        <!-- Dynamic Alerts Box -->
        <p v-if="alertMessage" :class="['mt-4 text-center text-sm font-semibold p-2.5 rounded-lg', isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100']">
          {{ alertMessage }}
        </p>

      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export default {
  data() {
    return {
      activeTab: 'login',
      alertMessage: '',
      isError: false,
      loginForm: { email: '', password: '' },
      registerForm: { name: '', email: '', password: '', date_of_birth: '', role: 'visitor' }
    };
  },
  methods: {
    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    async handleLogin() {
      this.alertMessage = '';
      if (!this.loginForm.email || !this.loginForm.password) {
        this.isError = true;
        this.alertMessage = '⚠️ Please fill out all required credentials.';
        return;
      }
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, this.loginForm);
        const safeUser = {
          ...response.data.user,
          role: String(response.data.user?.role || 'visitor').trim().toLowerCase()
        };

        this.isError = false;
        this.alertMessage = `✅ ${response.data.message}`;
        localStorage.setItem('userToken', response.data.token);
        localStorage.setItem('userData', JSON.stringify(safeUser));
        
        setTimeout(() => this.$router.push('/dashboard'), 1500);
      } catch (err) {
        this.isError = true;
        this.alertMessage = err.response?.data?.message || 'Login failed.';
      }
    },
    async handleRegister() {
      this.alertMessage = '';
      if (!this.registerForm.name || !this.registerForm.email || !this.registerForm.password || !this.registerForm.date_of_birth) {
        this.isError = true;
        this.alertMessage = '⚠️ Please fill in your full name, email, password, and date of birth.';
        return;
      }
      if (!this.isValidEmail(this.registerForm.email)) {
        this.isError = true;
        this.alertMessage = '⚠️ Email formatting error constraint flagged.';
        return;
      }

      const birthDate = new Date(this.registerForm.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();

      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
      }

      if (age < 18) {
        this.isError = true;
        this.alertMessage = '⚠️ You must be at least 18 years old to register.';
        return;
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/register`, this.registerForm);
        this.isError = false;
        this.alertMessage = `🎉 ${response.data.message}`;
        setTimeout(() => {
          this.activeTab = 'login';
          this.alertMessage = '';
        }, 2000);
      } catch (err) {
        this.isError = true;
        this.alertMessage = err.response?.data?.message || 'Platform registration error.';
      }
    }
  }
};
</script>
