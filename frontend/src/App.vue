<template>
  <div class="min-h-screen tech-grid" style="background-color: var(--bg-primary);">
    <!-- Header -->
    <header class="glass-card mx-4 mt-4 animate-slide-up">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-sm">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold gradient-text">BugHunter AI</h1>
              <p class="text-gray-400 text-xs">Autonomous Web Testing Platform</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2 px-3 py-1.5 rounded-full" :class="connected ? 'bg-green-500/10' : 'bg-red-500/10'">
              <span :class="connectionStatus.class" class="w-2 h-2 rounded-full"></span>
              <span class="text-xs font-medium" :class="connected ? 'text-green-400' : 'text-red-400'">{{ connectionStatus.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-6">
      <!-- Test Form -->
      <div v-if="!testRunning && !testComplete" class="max-w-4xl mx-auto">
        <TestForm @start-test="handleStartTest" />
      </div>

      <!-- Live Progress -->
      <div v-if="testRunning" class="max-w-6xl mx-auto">
        <LiveProgress
          :progress="progress"
          :currentDecision="currentDecision"
          :bugsFound="bugsFound"
          :sessionId="sessionId"
          @stop-test="handleStopTest"
        />
      </div>

      <!-- Bug Report -->
      <div v-if="testComplete" class="max-w-6xl mx-auto">
        <BugReport 
          :report="finalReport"
          @restart="handleRestart"
        />
      </div>

      <!-- Error Display -->
      <div v-if="error" class="max-w-4xl mx-auto mt-8 animate-slide-up">
        <div class="glass-card border-l-4 border-red-500 p-6">
          <div class="flex items-start space-x-4">
            <div class="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-red-400 font-bold text-lg mb-2">Error Occurred</h3>
              <p class="text-gray-300 mb-4">{{ error }}</p>
              <button
                @click="handleRestart"
                class="btn-danger"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="glass-card mx-4 mb-4 mt-16">
      <div class="container mx-auto px-6 py-6 text-center">
        <p class="text-sm text-gray-400">
          Built with <span class="text-blue-400">Vue 3</span>, <span class="text-blue-400">Playwright</span>, and <span class="text-purple-400">Claude AI</span>
        </p>
        <p class="text-xs mt-2 text-gray-600">
          © 2024 BugHunter AI • Autonomous Testing Platform
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import TestForm from './components/TestForm.vue';
import LiveProgress from './components/LiveProgress.vue';
import BugReport from './components/BugReport.vue';
import socketClient from './utils/socket.js';

// State
const testRunning = ref(false);
const testComplete = ref(false);
const progress = ref({
  message: '',
  percentage: 0
});
const currentDecision = ref(null);
const bugsFound = ref([]);
const finalReport = ref(null);
const error = ref(null);
const connected = ref(false);
const sessionId = ref(null);

// Connection status
const connectionStatus = computed(() => {
  if (connected.value) {
    return {
      class: 'bg-green-400 animate-pulse',
      text: 'Connected'
    };
  }
  return {
    class: 'bg-red-400',
    text: 'Disconnected'
  };
});

// Handle stop test
const handleStopTest = (data) => {
  console.log('Stopping test for session:', data.sessionId);
  socketClient.emit('stop-test', data);
};

// Handle test start
const handleStartTest = (testData) => {
  console.log('🚀 Starting test with data:', testData);

  // Reset state
  sessionId.value = null;
  testRunning.value = true;
  testComplete.value = false;
  error.value = null;
  bugsFound.value = [];
  currentDecision.value = null;
  progress.value = {
    message: 'Initializing test...',
    percentage: 0
  };

  // Emit start-test event
  socketClient.emit('start-test', testData);
};

// Handle restart
const handleRestart = () => {
  testRunning.value = false;
  testComplete.value = false;
  error.value = null;
  bugsFound.value = [];
  currentDecision.value = null;
  finalReport.value = null;
  progress.value = {
    message: '',
    percentage: 0
  };
};

// Setup socket listeners
onMounted(() => {
  const socket = socketClient.connect();
  
  socket.on('connect', () => {
    connected.value = true;
  });

  socket.on('disconnect', () => {
    connected.value = false;
  });

  socket.on('session-started', (data) => {
    console.log('✅ Session started:', data.sessionId);
    sessionId.value = data.sessionId;
  });

  socket.on('progress', (data) => {
    progress.value = data;
  });

  socket.on('ai-decision', (data) => {
    currentDecision.value = data;
  });

  socket.on('bug-found', (bug) => {
    bugsFound.value.push(bug);
  });

  socket.on('test-complete', (data) => {
    console.log('✅ Test complete:', data);
    testRunning.value = false;
    testComplete.value = true;
    finalReport.value = data.report;
  });

  socket.on('test-stopped', (data) => {
    console.log('⏹️ Test stopped:', data);
    testRunning.value = false;
    testComplete.value = true;
    finalReport.value = data.report;
  });

  socket.on('error', (data) => {
    console.error('❌ Error:', data.message);
    error.value = data.message;
    testRunning.value = false;
  });
});

onUnmounted(() => {
  socketClient.disconnect();
});
</script>
