<template>
  <div class="glass-card p-8 animate-slide-up">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white mb-2">Initialize Test Session</h2>
      <p class="text-gray-400 text-sm">Deploy AI agent for autonomous web testing</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Target URL -->
      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-2">
          Target URL
        </label>
        <input
          v-model="formData.targetUrl"
          type="url"
          required
          placeholder="https://your-app.com"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-500"
        />
        <p class="mt-2 text-xs text-gray-500">
          Application endpoint for testing
        </p>
      </div>

      <!-- Authentication Mode -->
      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-3">
          Authentication
        </label>
        <div class="flex space-x-4">
          <label class="flex items-center cursor-pointer group">
            <input
              v-model="authMode"
              type="radio"
              value="public"
              class="mr-2 text-blue-500 focus:ring-blue-500"
            />
            <span class="text-gray-300 group-hover:text-white transition text-sm">Public Access</span>
          </label>
          <label class="flex items-center cursor-pointer group">
            <input
              v-model="authMode"
              type="radio"
              value="cookies"
              class="mr-2 text-blue-500 focus:ring-blue-500"
            />
            <span class="text-gray-300 group-hover:text-white transition text-sm">Session Cookies</span>
          </label>
        </div>
      </div>

      <!-- Cookies Input -->
      <div v-if="authMode === 'cookies'">
        <label class="block text-sm font-semibold text-gray-300 mb-2">
          Cookies (JSON)
        </label>

        <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-3">
          <p class="text-xs text-blue-400 font-semibold mb-2">Cookie Extraction</p>
          <ol class="text-xs text-gray-400 space-y-1 list-decimal list-inside">
            <li>Login to target application</li>
            <li>Open browser console (F12)</li>
            <li>Execute extraction script</li>
          </ol>
          <div class="mt-2 bg-gray-900/50 p-3 rounded font-mono text-xs overflow-x-auto text-gray-300">
            <code>copy(document.cookie.split('; ').map(c => {
  const [name, value] = c.split('=');
  return { name, value, domain: location.hostname, path: '/' };
}));</code>
          </div>
          <p class="text-xs text-gray-400 mt-2">Paste output below</p>
        </div>

        <textarea
          v-model="formData.cookiesJson"
          rows="6"
          placeholder='[{"name":"session","value":"...","domain":"localhost","path":"/"}]'
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-600"
        />

        <div v-if="cookieValidation.error" class="mt-2 text-red-400 text-xs flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ cookieValidation.error }}
        </div>

        <div v-if="cookieValidation.valid" class="mt-2 text-green-400 text-xs flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ cookieValidation.message }}
        </div>
      </div>

      <!-- Testing Goal -->
      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-2">
          Test Objective (Optional)
        </label>
        <input
          v-model="formData.testingGoal"
          type="text"
          placeholder="e.g., 'Test checkout flow' or 'Explore dashboard'"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-600"
        />
        <p class="mt-2 text-xs text-gray-500">
          Direct AI focus to specific workflows
        </p>
      </div>

      <!-- Submit Button -->
      <div class="pt-4">
        <button
          type="submit"
          :disabled="!isFormValid"
          class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm py-4"
        >
          Deploy AI Agent
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const emit = defineEmits(['start-test']);

const formData = ref({
  targetUrl: '',
  cookiesJson: '',
  testingGoal: ''
});

const authMode = ref('public');

const cookieValidation = ref({
  valid: false,
  error: null,
  message: null
});

const validateCookies = () => {
  if (authMode.value === 'public') {
    cookieValidation.value = { valid: true, error: null, message: null };
    return;
  }

  if (!formData.value.cookiesJson.trim()) {
    cookieValidation.value = { valid: false, error: null, message: null };
    return;
  }

  try {
    const cookies = JSON.parse(formData.value.cookiesJson);

    if (!Array.isArray(cookies)) {
      cookieValidation.value = {
        valid: false,
        error: 'Invalid format: expected array',
        message: null
      };
      return;
    }

    if (cookies.length === 0) {
      cookieValidation.value = {
        valid: false,
        error: 'Empty cookie array',
        message: null
      };
      return;
    }

    for (const cookie of cookies) {
      if (!cookie.name || !cookie.value) {
        cookieValidation.value = {
          valid: false,
          error: 'Missing name/value fields',
          message: null
        };
        return;
      }
    }

    cookieValidation.value = {
      valid: true,
      error: null,
      message: `${cookies.length} cookies loaded`
    };
  } catch (error) {
    cookieValidation.value = {
      valid: false,
      error: 'JSON parse error',
      message: null
    };
  }
};

watch(() => formData.value.cookiesJson, validateCookies);
watch(authMode, validateCookies);

const isFormValid = computed(() => {
  if (!formData.value.targetUrl) {
    return false;
  }

  if (authMode.value === 'cookies') {
    return cookieValidation.value.valid;
  }

  return true;
});

const handleSubmit = () => {
  if (!isFormValid.value) {
    return;
  }

  let cookies = [];

  if (authMode.value === 'cookies') {
    try {
      cookies = JSON.parse(formData.value.cookiesJson);
    } catch (error) {
      console.error('Failed to parse cookies:', error);
      return;
    }
  }

  emit('start-test', {
    targetUrl: formData.value.targetUrl,
    cookies: cookies,
    testingGoal: formData.value.testingGoal || 'General exploration to find bugs'
  });
};
</script>
