<template>
  <div class="space-y-8">
    <!-- Success Header -->
    <div :class="report.isPartial ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-blue-500'" class="rounded-2xl shadow-xl p-8 text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <span class="text-6xl">{{ report.isPartial ? '⚠️' : '✅' }}</span>
          <div>
            <h2 class="text-3xl font-bold mb-2">{{ report.isPartial ? 'Test Stopped - Partial Results' : 'Test Complete!' }}</h2>
            <p :class="report.isPartial ? 'text-yellow-100' : 'text-green-100'">{{ report.isPartial ? 'Test stopped by user' : 'AI exploration finished successfully' }}</p>
          </div>
        </div>
        <button
          @click="$emit('restart')"
          class="px-6 py-3 bg-white text-green-600 font-bold rounded-lg hover:bg-green-50 transition transform hover:scale-105"
        >
          🔄 Test Another App
        </button>
      </div>
    </div>

    <!-- Partial Report Banner -->
    <div v-if="report.isPartial" class="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg shadow">
      <div class="flex items-start">
        <span class="text-2xl mr-3">⚠️</span>
        <div>
          <h3 class="font-bold text-yellow-900">Partial Results - Test Stopped Early</h3>
          <p class="text-yellow-800 text-sm mt-1">{{ report.partialDataNotice }}</p>
          <div class="mt-2 text-sm text-yellow-700">
            Completed: {{ report.summary.stepsCompleted }}/{{ report.summary.maxStepsPlanned }} steps
            ({{ report.summary.completionPercentage }}%)
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-3xl">⏱️</span>
          <span class="text-sm text-gray-500">Duration</span>
        </div>
        <div class="text-2xl font-bold text-gray-900">{{ report.summary.testDuration }}</div>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-3xl">📄</span>
          <span class="text-sm text-gray-500">Pages</span>
        </div>
        <div class="text-2xl font-bold text-gray-900">{{ report.summary.pagesVisited }}</div>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-3xl">🐛</span>
          <span class="text-sm text-gray-500">Bugs</span>
        </div>
        <div class="text-2xl font-bold text-red-600">{{ report.summary.bugsFound }}</div>
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-3xl">⚠️</span>
          <span class="text-sm text-gray-500">High Severity</span>
        </div>
        <div class="text-2xl font-bold text-red-600">{{ report.summary.bugsBySeverity.high }}</div>
      </div>
    </div>

    <!-- Website Brief -->
    <div v-if="report.websiteBrief" class="bg-white rounded-2xl shadow-xl p-8" id="website-brief-section">
      <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span class="text-3xl mr-3">📝</span>
        Website Analysis
      </h3>
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
        <div
          class="text-gray-800 leading-relaxed prose prose-slate max-w-none markdown-content"
          v-html="formattedWebsiteBrief"
        ></div>
      </div>
    </div>

    <!-- Test Cases -->
    <div v-if="report.testCases && report.allTestCases && report.allTestCases.length > 0" class="bg-white rounded-2xl shadow-xl p-8">
      <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span class="text-3xl mr-3">✅</span>
        QA Test Cases
      </h3>

      <!-- Test Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div class="text-sm text-blue-600 font-semibold">Total Tests</div>
          <div class="text-3xl font-bold text-blue-900">{{ report.allTestCases.length }}</div>
        </div>
        <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div class="text-sm text-green-600 font-semibold">Passed</div>
          <div class="text-3xl font-bold text-green-900">{{ report.testCases.passed.length }}</div>
        </div>
        <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div class="text-sm text-red-600 font-semibold">Failed</div>
          <div class="text-3xl font-bold text-red-900">{{ report.testCases.failed.length }}</div>
        </div>
      </div>

      <!-- Passed Test Cases -->
      <div v-if="report.testCases.passed.length > 0" class="mb-8">
        <h4 class="text-xl font-bold text-green-700 mb-4 flex items-center">
          <span class="text-2xl mr-2">✓</span>
          Passed Tests ({{ report.testCases.passed.length }})
        </h4>
        <div class="space-y-4">
          <div v-for="test in report.testCases.passed" :key="test.id"
               class="border-2 border-green-200 bg-green-50 rounded-lg p-5">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold">{{ test.id }}</span>
                  <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{{ test.type }}</span>
                </div>
                <h5 class="text-lg font-bold text-gray-900 mb-2">{{ test.title }}</h5>
                <p class="text-gray-700 mb-3">{{ test.description }}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-semibold text-gray-700">Expected:</span>
                <p class="text-gray-600 mt-1">{{ test.expectedResult }}</p>
              </div>
              <div>
                <span class="font-semibold text-green-700">Actual:</span>
                <p class="text-green-600 mt-1">{{ test.actualResult }}</p>
              </div>
            </div>
            <!-- Form Submission Details -->
            <div v-if="test.type === 'form-submission' && test.submissionDetails" class="mt-4 pt-4 border-t border-green-200">
              <span class="font-semibold text-gray-700 text-sm">Submission Details:</span>
              <ul class="text-xs text-gray-600 mt-2 space-y-1">
                <li v-if="test.submissionDetails.urlChanged">
                  ✓ URL changed to: <code class="bg-green-100 px-1 rounded">{{ test.submissionDetails.newUrl }}</code>
                </li>
                <li v-if="test.submissionDetails.indicators?.hasSuccessMessage">✓ Success message detected</li>
                <li v-if="test.submissionDetails.indicators?.formDisappeared">✓ Form disappeared after submission</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Failed Test Cases -->
      <div v-if="report.testCases.failed.length > 0" class="mb-8">
        <h4 class="text-xl font-bold text-red-700 mb-4 flex items-center">
          <span class="text-2xl mr-2">✗</span>
          Failed Tests ({{ report.testCases.failed.length }})
        </h4>
        <div class="space-y-4">
          <div v-for="test in report.testCases.failed" :key="test.id"
               class="border-2 border-red-200 bg-red-50 rounded-lg p-5">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold">{{ test.id }}</span>
                  <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{{ test.type }}</span>
                </div>
                <h5 class="text-lg font-bold text-gray-900 mb-2">{{ test.title }}</h5>
                <p class="text-gray-700 mb-3">{{ test.description }}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-semibold text-gray-700">Expected:</span>
                <p class="text-gray-600 mt-1">{{ test.expectedResult }}</p>
              </div>
              <div>
                <span class="font-semibold text-red-700">Actual:</span>
                <p class="text-red-600 mt-1">{{ test.actualResult }}</p>
              </div>
            </div>
            <!-- Form Submission Details for Failed Submissions -->
            <div v-if="test.type === 'form-submission' && test.submissionDetails" class="mt-4 pt-4 border-t border-red-200">
              <span class="font-semibold text-gray-700 text-sm">Submission Details:</span>
              <ul class="text-xs text-gray-600 mt-2 space-y-1">
                <li v-if="test.submissionDetails.urlChanged">
                  ✓ URL changed to: <code class="bg-red-100 px-1 rounded">{{ test.submissionDetails.newUrl }}</code>
                </li>
                <li v-if="test.submissionDetails.indicators?.hasErrorMessage">✗ Error message detected on page</li>
                <li v-if="!test.submissionDetails.indicators?.hasSuccessMessage && !test.submissionDetails.indicators?.formDisappeared && !test.submissionDetails.urlChanged">
                  ⚠ No clear success indicators found
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Flow Chart -->
    <div v-if="report.flowChart" class="bg-white rounded-2xl shadow-xl p-8">
      <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span class="text-3xl mr-3">🗺️</span>
        Navigation Flow
      </h3>
      <div class="bg-gray-50 p-6 rounded-xl overflow-x-auto">
        <div ref="mermaidContainer" class="mermaid">
          {{ report.flowChart }}
        </div>
      </div>
    </div>

    <!-- Bug Reports -->
    <div v-if="report.bugs && report.bugs.length > 0" class="bg-white rounded-2xl shadow-xl p-8">
      <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span class="text-3xl mr-3">🐛</span>
        Bug Reports
      </h3>

      <div class="space-y-8">
        <div 
          v-for="bug in report.bugs" 
          :key="bug.id"
          class="border-2 rounded-xl p-6"
          :class="getBugBorderClass(bug.severity)"
        >
          <!-- Bug Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <span class="text-2xl font-bold text-gray-700">Bug #{{ bug.bugNumber }}</span>
                <span :class="getSeverityBadge(bug.severity)" class="px-3 py-1 rounded-full text-sm font-bold">
                  {{ bug.severity.toUpperCase() }}
                </span>
                <span class="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                  {{ bug.type }}
                </span>
              </div>
              <h4 class="text-xl font-bold text-gray-900 mb-2">{{ bug.title }}</h4>
              <p class="text-gray-700">{{ bug.description }}</p>
            </div>
          </div>

          <!-- Screenshot -->
          <div v-if="bug.screenshot" class="mb-6">
            <h5 class="font-semibold text-gray-700 mb-3">📸 Visual Evidence:</h5>
            <div class="bg-gray-100 rounded-lg p-2 overflow-hidden">
              <img 
                :src="'data:image/png;base64,' + bug.screenshot" 
                alt="Bug screenshot"
                class="w-full rounded shadow-lg cursor-pointer hover:scale-105 transition"
                @click="openScreenshot(bug.screenshot)"
              />
            </div>
          </div>

          <!-- Steps to Reproduce -->
          <div v-if="bug.stepsToReproduce" class="mb-4">
            <h5 class="font-semibold text-gray-700 mb-2">📋 Steps to Reproduce:</h5>
            <ol class="list-decimal list-inside space-y-1 text-gray-700 bg-gray-50 p-4 rounded-lg">
              <li v-for="(step, index) in bug.stepsToReproduce" :key="index">{{ step }}</li>
            </ol>
          </div>

          <!-- Location -->
          <div class="flex items-center space-x-2 text-sm text-gray-600">
            <span>🔗</span>
            <span class="font-mono">{{ bug.url }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- No Bugs Found -->
    <div v-else class="bg-white rounded-2xl shadow-xl p-12 text-center">
      <span class="text-8xl mb-4 block">🎉</span>
      <h3 class="text-2xl font-bold text-gray-900 mb-2">No Bugs Found!</h3>
      <p class="text-gray-600">Your application passed all AI tests without any detected issues.</p>
    </div>

    <!-- Download Report Button -->
    <div class="flex justify-center">
      <button
        @click="downloadReport"
        class="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition transform hover:scale-105 shadow-lg"
      >
        <span class="flex items-center space-x-2">
          <span class="text-xl">📥</span>
          <span>Download Full Report</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import mermaid from 'mermaid';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';

const props = defineProps({
  report: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['restart']);

const mermaidContainer = ref(null);

// Format website brief markdown to HTML
const formattedWebsiteBrief = computed(() => {
  if (!props.report.websiteBrief) return '';
  return marked(props.report.websiteBrief);
});

// Initialize Mermaid
onMounted(async () => {
  mermaid.initialize({ 
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose'
  });
  
  await nextTick();
  
  if (mermaidContainer.value && props.report.flowChart) {
    try {
      mermaid.contentLoaded();
    } catch (error) {
      console.error('Mermaid rendering error:', error);
    }
  }
});

// Get bug border class
const getBugBorderClass = (severity) => {
  if (severity === 'high') return 'border-red-500 bg-red-50';
  if (severity === 'medium') return 'border-orange-500 bg-orange-50';
  if (severity === 'low') return 'border-yellow-500 bg-yellow-50';
  return 'border-gray-300 bg-gray-50';
};

// Get severity badge class
const getSeverityBadge = (severity) => {
  if (severity === 'high') return 'bg-red-600 text-white';
  if (severity === 'medium') return 'bg-orange-500 text-white';
  if (severity === 'low') return 'bg-yellow-500 text-white';
  return 'bg-gray-500 text-white';
};

// Open screenshot in new window
const openScreenshot = (screenshot) => {
  const win = window.open();
  win.document.write(`<img src="data:image/png;base64,${screenshot}" style="max-width:100%; height:auto;" />`);
};

// Download report as PDF
const downloadReport = async () => {
  // Clone the entire report container
  const element = document.querySelector('.space-y-8');

  if (!element) {
    console.error('Report container not found');
    return;
  }

  // Configure PDF options
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `bughunter-report-${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    // Generate PDF from the entire report
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
</script>

<style scoped>
/* Markdown content styling */
.markdown-content :deep(h1) {
  @apply text-2xl font-bold text-gray-900 mb-4 mt-6;
}

.markdown-content :deep(h2) {
  @apply text-xl font-bold text-gray-800 mb-3 mt-5;
}

.markdown-content :deep(h3) {
  @apply text-lg font-bold text-gray-700 mb-2 mt-4;
}

.markdown-content :deep(p) {
  @apply text-gray-700 mb-3 leading-relaxed;
}

.markdown-content :deep(ul) {
  @apply list-disc list-inside mb-3 space-y-1;
}

.markdown-content :deep(ol) {
  @apply list-decimal list-inside mb-3 space-y-1;
}

.markdown-content :deep(li) {
  @apply text-gray-700 ml-2;
}

.markdown-content :deep(strong) {
  @apply font-bold text-gray-900;
}

.markdown-content :deep(em) {
  @apply italic;
}

.markdown-content :deep(code) {
  @apply bg-gray-200 px-2 py-1 rounded text-sm font-mono;
}

.markdown-content :deep(blockquote) {
  @apply border-l-4 border-blue-500 pl-4 italic text-gray-600 my-3;
}
</style>
