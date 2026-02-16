<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div class="container mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <span class="text-4xl">🐛</span>
            <div>
              <h1 class="text-3xl font-bold">BugHunter</h1>
              <p class="text-purple-100 text-sm">AI-Powered Web Testing</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span :class="connectionStatus.class" class="w-3 h-3 rounded-full"></span>
            <span class="text-sm">{{ connectionStatus.text }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
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
      <div v-if="error" class="max-w-4xl mx-auto mt-8">
        <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div class="flex items-start">
            <span class="text-3xl mr-4">❌</span>
            <div>
              <h3 class="text-red-800 font-bold text-lg mb-2">Error Occurred</h3>
              <p class="text-red-700">{{ error }}</p>
              <button 
                @click="handleRestart"
                class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-gray-300 mt-16">
      <div class="container mx-auto px-6 py-8 text-center">
        <p class="text-sm">
          Built with ❤️ using Vue 3, Playwright, and Claude AI
        </p>
        <p class="text-xs mt-2 text-gray-500">
          Hackathon Project - AI Product Engineer
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
