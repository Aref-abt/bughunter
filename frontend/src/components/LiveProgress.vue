<template>
  <div class="space-y-6">
    <!-- Progress Header -->
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <div class="animate-pulse">
            <span class="text-5xl">🤖</span>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Testing in Progress...</h2>
            <p class="text-gray-600">AI is exploring your application</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold text-purple-600">{{ progress.percentage }}%</div>
          <div class="text-sm text-gray-500">Complete</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
        <div 
          class="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
          :style="{ width: progress.percentage + '%' }"
        />
      </div>

      <!-- Current Status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3 text-gray-700">
          <span class="text-xl">📍</span>
          <span class="font-medium">{{ progress.message }}</span>
        </div>
        <!-- Stop Button -->
        <button
          v-if="!isStoppingTest && !testStopped"
          @click="handleStopClick"
          class="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
        >
          ⏹️ Stop Test
        </button>
        <span v-else-if="isStoppingTest" class="text-yellow-600 font-semibold">
          ⏳ Stopping and generating report...
        </span>
      </div>
    </div>

    <!-- AI Decision Display -->
    <div v-if="currentDecision" class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-lg p-8 border-2 border-purple-200">
      <div class="flex items-start space-x-4">
        <span class="text-4xl">🧠</span>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-purple-900 mb-2">
            AI Decision - Step {{ currentDecision.step }}
          </h3>
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-semibold text-purple-700">Action:</span>
              <span class="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                {{ formatAction(currentDecision.decision) }}
              </span>
            </div>
            <div>
              <span class="text-sm font-semibold text-purple-700">Reasoning:</span>
              <p class="text-gray-700 mt-1">{{ currentDecision.reasoning }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bugs Found Counter -->
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <span class="text-4xl">🐛</span>
          <div>
            <h3 class="text-xl font-bold text-gray-900">Bugs Detected</h3>
            <p class="text-gray-600 text-sm">Issues found during testing</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-5xl font-bold text-red-600">{{ bugsFound.length }}</div>
          <div class="text-sm text-gray-500">Total</div>
        </div>
      </div>

      <!-- Recent Bugs List -->
      <div v-if="bugsFound.length > 0" class="mt-6 space-y-3">
        <div 
          v-for="(bug, index) in recentBugs" 
          :key="bug.id"
          class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-fade-in"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-1">
                <span class="text-red-700 font-bold text-sm">Bug #{{ bugsFound.length - index }}</span>
                <span :class="getSeverityClass(bug.severity)" class="px-2 py-0.5 rounded text-xs font-semibold">
                  {{ bug.severity }}
                </span>
              </div>
              <h4 class="font-semibold text-gray-900 mb-1">{{ bug.title }}</h4>
              <p class="text-sm text-gray-700">{{ bug.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="mt-6 text-center py-8 text-gray-400">
        <span class="text-5xl mb-3 block">✨</span>
        <p>No bugs found yet...</p>
      </div>
    </div>

    <!-- Live Activity Log -->
    <div class="bg-gray-900 rounded-2xl shadow-xl p-8 text-white">
      <h3 class="text-lg font-bold mb-4 flex items-center">
        <span class="text-2xl mr-2">📊</span>
        Activity Log
      </h3>
      <div class="space-y-2 font-mono text-sm max-h-64 overflow-y-auto">
        <div v-for="(log, index) in activityLogs" :key="index" class="flex items-start space-x-2 text-gray-300">
          <span class="text-gray-500">{{ log.timestamp }}</span>
          <span>{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  progress: {
    type: Object,
    required: true
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

// Stop test state
const isStoppingTest = ref(false);
const testStopped = ref(false);

// Handle stop button click
const handleStopClick = () => {
  if (props.sessionId && !isStoppingTest.value) {
    isStoppingTest.value = true;
    emit('stop-test', { sessionId: props.sessionId });
  }
};

// Activity logs
const activityLogs = ref([]);

// Watch progress for activity logs
watch(() => props.progress, (newProgress) => {
  if (newProgress.message) {
    activityLogs.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      message: newProgress.message
    });
    
    // Keep only last 20 logs
    if (activityLogs.value.length > 20) {
      activityLogs.value = activityLogs.value.slice(0, 20);
    }
  }
}, { deep: true });

// Recent bugs (last 3)
const recentBugs = computed(() => {
  return props.bugsFound.slice(-3).reverse();
});

// Format action name
const formatAction = (action) => {
  if (action === 'click') return '🖱️ Click';
  if (action === 'fill-form') return '📝 Fill Form';
  if (action === 'done') return '✅ Complete';
  return action;
};

// Get severity class
const getSeverityClass = (severity) => {
  if (severity === 'high') return 'bg-red-600 text-white';
  if (severity === 'medium') return 'bg-orange-500 text-white';
  if (severity === 'low') return 'bg-yellow-500 text-white';
  return 'bg-gray-500 text-white';
};
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
