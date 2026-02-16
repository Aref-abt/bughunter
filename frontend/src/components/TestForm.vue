<template>
  <div class="bg-white rounded-2xl shadow-xl p-8">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Start AI Testing</h2>
      <p class="text-gray-600">Test any web application with AI-powered exploration</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Target URL -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Target Website URL
        </label>
        <input
          v-model="formData.targetUrl"
          type="url"
          required
          placeholder="http://localhost:9000 or https://your-app.com"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
        />
        <p class="mt-2 text-sm text-gray-500">
          The URL of the application you want to test
        </p>
      </div>

      <!-- Authentication Mode -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-3">
          Authentication Mode
        </label>
        <div class="flex space-x-4">
          <label class="flex items-center cursor-pointer">
            <input
              v-model="authMode"
              type="radio"
              value="public"
              class="mr-2"
            />
            <span class="text-gray-700">Public (no authentication)</span>
          </label>
          <label class="flex items-center cursor-pointer">
            <input
              v-model="authMode"
              type="radio"
              value="cookies"
              class="mr-2"
            />
            <span class="text-gray-700">Authenticated (paste cookies)</span>
          </label>
        </div>
      </div>

      <!-- Cookies Input -->
      <div v-if="authMode === 'cookies'">
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Session Cookies (JSON format)
        </label>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
          <p class="text-sm text-blue-800 font-semibold mb-2">📋 How to get cookies:</p>
          <ol class="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Log into your app in Chrome</li>
            <li>Press F12 → Console tab</li>
            <li>Paste and run this code:</li>
          </ol>
          <div class="mt-2 bg-blue-100 p-3 rounded font-mono text-xs overflow-x-auto">
            <code>copy(document.cookie.split('; ').map(c => {
  const [name, value] = c.split('=');
  return { name, value, domain: location.hostname, path: '/' };
}));</code>
          </div>
          <p class="text-sm text-blue-700 mt-2">4. Paste the result below</p>
        </div>

        <textarea
          v-model="formData.cookiesJson"
          rows="8"
          placeholder='[
  {
    "name": "session_id",
    "value": "abc123...",
    "domain": "localhost",
    "path": "/"
  }
]'
          class="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
        />
        
        <div v-if="cookieValidation.error" class="mt-2 text-red-600 text-sm flex items-center">
          <span class="mr-2">⚠️</span>
          {{ cookieValidation.error }}
        </div>
        
        <div v-if="cookieValidation.valid" class="mt-2 text-green-600 text-sm flex items-center">
          <span class="mr-2">✅</span>
          {{ cookieValidation.message }}
        </div>
      </div>

      <!-- Testing Goal (Optional) -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Testing Goal (Optional)
        </label>
        <input
          v-model="formData.testingGoal"
          type="text"
          placeholder="e.g., 'Test the CTR form workflow' or 'Explore the dashboard'"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
        />
        <p class="mt-2 text-sm text-gray-500">
          Guide the AI to focus on specific areas
        </p>
      </div>

      <!-- Submit Button -->
      <div class="pt-4">
        <button
          type="submit"
          :disabled="!isFormValid"
          class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          <span class="flex items-center justify-center">
            <span class="text-2xl mr-3">🚀</span>
            <span class="text-lg">Start AI Testing</span>
          </span>
        </button>
      </div>
    </form>

    <!-- Example Section -->
    <div class="mt-8 pt-8 border-t border-gray-200">
      <details class="cursor-pointer">
        <summary class="text-sm font-semibold text-gray-700 hover:text-purple-600 transition">
          💡 See example cookies format
        </summary>
        <div class="mt-3 bg-gray-50 p-4 rounded-lg">
          <pre class="text-xs overflow-x-auto"><code>[
  {
    "name": "PLAY_SESSION",
    "value": "eyJhbGciOiJIUzI1NiJ9...",
    "domain": "localhost",
    "path": "/",
    "expires": -1,
    "httpOnly": false,
    "secure": false,
    "sameSite": "Lax"
  }
]</code></pre>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const emit = defineEmits(['start-test']);

// Form data
const formData = ref({
  targetUrl: '',
  cookiesJson: '',
  testingGoal: ''
});

const authMode = ref('cookies');

// Cookie validation
const cookieValidation = ref({
  valid: false,
  error: null,
  message: null
});

// Validate cookies JSON
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
        error: 'Cookies must be an array',
        message: null
      };
      return;
    }

    if (cookies.length === 0) {
      cookieValidation.value = {
        valid: false,
        error: 'Cookie array is empty',
        message: null
      };
      return;
    }

    // Check if cookies have required fields
    for (const cookie of cookies) {
      if (!cookie.name || !cookie.value) {
        cookieValidation.value = {
          valid: false,
          error: 'Each cookie must have name and value',
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
      error: 'Invalid JSON format',
      message: null
    };
  }
};

// Watch cookies input for validation
watch(() => formData.value.cookiesJson, validateCookies);
watch(authMode, validateCookies);

// Form validation
const isFormValid = computed(() => {
  if (!formData.value.targetUrl) {
    return false;
  }

  if (authMode.value === 'cookies') {
    return cookieValidation.value.valid;
  }

  return true;
});

// Handle form submission
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
