<template>
  <div class="space-y-4 animate-slide-up">
    <!-- Progress Header -->
    <div class="glass-card p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center animate-pulse-glow">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-white">AI Agent Active</h2>
            <p class="text-gray-400 text-xs">Autonomous exploration in progress</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold gradient-text">{{ progress.percentage }}%</div>
          <div class="text-xs text-gray-500">Progress</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-gray-800/50 rounded-full h-2 mb-4 overflow-hidden">
        <div
          class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out glow-sm"
          :style="{ width: progress.percentage + '%' }"
        />
      </div>

      <!-- Current Status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2 text-gray-300 text-sm">
          <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="font-medium">{{ progress.message }}</span>
        </div>
        <!-- Stop Button -->
        <button
          v-if="!isStoppingTest && !testStopped"
          @click="handleStopClick"
          class="px-4 py-2 bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/30 border border-red-500/30 transition flex items-center space-x-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          <span>Stop</span>
        </button>
        <span v-else-if="isStoppingTest" class="text-yellow-400 font-semibold text-xs flex items-center space-x-2">
          <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Generating report...</span>
        </span>
      </div>
    </div>

    <!-- AI Decision Display -->
    <div v-if="currentDecision" class="glass-card p-6 border-l-4 border-blue-500">
      <div class="flex items-start space-x-3">
        <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-bold text-white mb-3">
            Step {{ currentDecision.step }} • AI Decision
          </h3>
          <div class="space-y-2 text-xs">
            <div class="flex items-center space-x-2">
              <span class="text-gray-400">Action:</span>
              <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium border border-blue-500/30">
                {{ formatAction(currentDecision.decision) }}
              </span>
            </div>
            <div>
              <span class="text-gray-400">Reasoning:</span>
              <p class="text-gray-300 mt-1">{{ currentDecision.reasoning }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bugs Found Counter -->
    <div class="glass-card p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Issues Detected</h3>
            <p class="text-gray-400 text-xs">Found during exploration</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-4xl font-bold text-red-400">{{ bugsFound.length }}</div>
          <div class="text-xs text-gray-500">Total</div>
        </div>
      </div>

      <!-- Recent Bugs List -->
      <div v-if="bugsFound.length > 0" class="space-y-2">
        <div
          v-for="(bug, index) in recentBugs"
          :key="bug.id"
          class="bg-red-500/10 border-l-2 border-red-500/50 p-3 rounded-lg animate-slide-up"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-1">
                <span class="text-red-400 font-bold text-xs">Issue #{{ bugsFound.length - index }}</span>
                <span :class="getSeverityClass(bug.severity)" class="px-2 py-0.5 rounded text-xs font-semibold">
                  {{ bug.severity.toUpperCase() }}
                </span>
              </div>
              <h4 class="text-sm font-semibold text-white mb-1">{{ bug.title }}</h4>
              <p class="text-xs text-gray-400">{{ bug.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-6">
        <svg class="w-12 h-12 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-500 text-sm">No issues detected yet</p>
        <p class="text-gray-600 text-xs mt-1">AI is analyzing your application</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  progress: {
    type: Object,
    required: true,
    default: () => ({ message: '', percentage: 0 })
  },
  currentDecision: {
    type: Object,
    default: null
  },
  bugsFound: {
    type: Array,
    default: () => []
  },
  sessionId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['stop-test']);

const isStoppingTest = ref(false);
const testStopped = ref(false);

const recentBugs = computed(() => {
  return props.bugsFound.slice(-3).reverse();
});

const handleStopClick = () => {
  if (props.sessionId && !isStoppingTest.value) {
    isStoppingTest.value = true;
    emit('stop-test', { sessionId: props.sessionId });
  }
};

const formatAction = (action) => {
  if (!action) return 'Unknown';
  return action.charAt(0).toUpperCase() + action.slice(1);
};

const getSeverityClass = (severity) => {
  const classes = {
    critical: 'bg-red-600 text-white',
    high: 'bg-red-500/30 text-red-400 border border-red-500/50',
    medium: 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50',
    low: 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
  };
  return classes[severity?.toLowerCase()] || classes.medium;
};
</script>
