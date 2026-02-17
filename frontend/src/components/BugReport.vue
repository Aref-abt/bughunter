<template>
  <div class="space-y-6 animate-slide-up">
    <!-- Success Header -->
    <div class="glass-card p-8 border-l-4" :class="report.isPartial ? 'border-yellow-500' : 'border-green-500'">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 rounded-lg flex items-center justify-center" :class="report.isPartial ? 'bg-yellow-500/20' : 'bg-green-500/20'">
            <svg v-if="!report.isPartial" class="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 class="text-3xl font-bold text-white mb-1">
              {{ report.isPartial ? 'Test Stopped - Partial Results' : 'Test Complete!' }}
            </h2>
            <p :class="report.isPartial ? 'text-yellow-400' : 'text-green-400'" class="text-sm">
              {{ report.isPartial ? 'Test stopped by user' : 'AI exploration finished successfully' }}
            </p>
          </div>
        </div>
        <button
          @click="$emit('restart')"
          class="px-6 py-3 bg-blue-500/20 text-blue-400 font-semibold rounded-lg hover:bg-blue-500/30 border border-blue-500/30 transition flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Test Another App</span>
        </button>
      </div>
    </div>

    <!-- Partial Report Banner -->
    <div v-if="report.isPartial" class="glass-card p-6 border-l-4 border-yellow-500">
      <div class="flex items-start space-x-3">
        <div class="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-white text-lg mb-1">Partial Results - Test Stopped Early</h3>
          <p class="text-gray-400 text-sm mb-2">{{ report.partialDataNotice }}</p>
          <div class="text-sm text-gray-500">
            Completed: {{ report.summary.stepsCompleted }}/{{ report.summary.maxStepsPlanned }} steps
            ({{ report.summary.completionPercentage }}%)
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="text-xs text-gray-500 font-medium">Duration</span>
        </div>
        <div class="text-2xl font-bold text-white">{{ report.summary.testDuration }}</div>
      </div>

      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span class="text-xs text-gray-500 font-medium">Pages</span>
        </div>
        <div class="text-2xl font-bold text-white">{{ report.summary.pagesVisited }}</div>
      </div>

      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span class="text-xs text-gray-500 font-medium">Bugs</span>
        </div>
        <div class="text-2xl font-bold text-red-400">{{ report.summary.bugsFound }}</div>
      </div>

      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span class="text-xs text-gray-500 font-medium">High Severity</span>
        </div>
        <div class="text-2xl font-bold text-orange-400">{{ report.summary.bugsBySeverity.high }}</div>
      </div>
    </div>

    <!-- Website Brief -->
    <div v-if="report.websiteBrief" class="glass-card p-8" id="website-brief-section">
      <div class="flex items-center space-x-3 mb-6">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-white">Website Analysis</h3>
      </div>
      <div class="bg-gray-800/30 p-6 rounded-lg border border-gray-700/50">
        <div
          class="text-gray-300 leading-relaxed prose prose-invert max-w-none markdown-content"
          v-html="formattedWebsiteBrief"
        ></div>
      </div>
    </div>

    <!-- Test Cases -->
    <div v-if="report.testCases && report.allTestCases && report.allTestCases.length > 0" class="glass-card p-8">
      <div class="flex items-center space-x-3 mb-6">
        <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-white">QA Test Cases</h3>
      </div>

      <!-- Test Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div class="text-xs text-blue-400 font-semibold mb-1">Total Tests</div>
          <div class="text-3xl font-bold text-blue-300">{{ report.allTestCases.length }}</div>
        </div>
        <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div class="text-xs text-green-400 font-semibold mb-1">Passed</div>
          <div class="text-3xl font-bold text-green-300">{{ report.testCases.passed.length }}</div>
        </div>
        <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div class="text-xs text-red-400 font-semibold mb-1">Failed</div>
          <div class="text-3xl font-bold text-red-300">{{ report.testCases.failed.length }}</div>
        </div>
      </div>

      <!-- Passed Test Cases -->
      <div v-if="report.testCases.passed.length > 0" class="mb-8">
        <div class="flex items-center space-x-2 mb-4">
          <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <h4 class="text-lg font-bold text-green-400">
            Passed Tests ({{ report.testCases.passed.length }})
          </h4>
        </div>
        <div class="space-y-3">
          <div v-for="test in report.testCases.passed" :key="test.id"
               class="border border-green-500/30 bg-green-500/5 rounded-lg p-5">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold border border-green-500/30">{{ test.id }}</span>
                  <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold border border-blue-500/30">{{ test.type }}</span>
                </div>
                <h5 class="text-base font-bold text-white mb-2">{{ test.title }}</h5>
                <p class="text-gray-400 text-sm mb-3">{{ test.description }}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-semibold text-gray-400 text-xs">Expected:</span>
                <p class="text-gray-500 mt-1 text-xs">{{ test.expectedResult }}</p>
              </div>
              <div>
                <span class="font-semibold text-green-400 text-xs">Actual:</span>
                <p class="text-green-500 mt-1 text-xs">{{ test.actualResult }}</p>
              </div>
            </div>
            <!-- Form Submission Details -->
            <div v-if="test.type === 'form-submission' && test.submissionDetails" class="mt-4 pt-4 border-t border-green-500/20">
              <span class="font-semibold text-gray-400 text-xs">Submission Details:</span>
              <ul class="text-xs text-gray-500 mt-2 space-y-1">
                <li v-if="test.submissionDetails.urlChanged" class="flex items-center space-x-1">
                  <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>URL changed to: <code class="bg-green-500/10 px-1 rounded text-green-400">{{ test.submissionDetails.newUrl }}</code></span>
                </li>
                <li v-if="test.submissionDetails.indicators?.hasSuccessMessage" class="flex items-center space-x-1">
                  <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Success message detected</span>
                </li>
                <li v-if="test.submissionDetails.indicators?.formDisappeared" class="flex items-center space-x-1">
                  <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Form disappeared after submission</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Failed Test Cases -->
      <div v-if="report.testCases.failed.length > 0" class="mb-8">
        <div class="flex items-center space-x-2 mb-4">
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h4 class="text-lg font-bold text-red-400">
            Failed Tests ({{ report.testCases.failed.length }})
          </h4>
        </div>
        <div class="space-y-3">
          <div v-for="test in report.testCases.failed" :key="test.id"
               class="border border-red-500/30 bg-red-500/5 rounded-lg p-5">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold border border-red-500/30">{{ test.id }}</span>
                  <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold border border-blue-500/30">{{ test.type }}</span>
                </div>
                <h5 class="text-base font-bold text-white mb-2">{{ test.title }}</h5>
                <p class="text-gray-400 text-sm mb-3">{{ test.description }}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-semibold text-gray-400 text-xs">Expected:</span>
                <p class="text-gray-500 mt-1 text-xs">{{ test.expectedResult }}</p>
              </div>
              <div>
                <span class="font-semibold text-red-400 text-xs">Actual:</span>
                <p class="text-red-500 mt-1 text-xs">{{ test.actualResult }}</p>
              </div>
            </div>
            <!-- Form Submission Details for Failed Submissions -->
            <div v-if="test.type === 'form-submission' && test.submissionDetails" class="mt-4 pt-4 border-t border-red-500/20">
              <span class="font-semibold text-gray-400 text-xs">Submission Details:</span>
              <ul class="text-xs text-gray-500 mt-2 space-y-1">
                <li v-if="test.submissionDetails.urlChanged" class="flex items-center space-x-1">
                  <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>URL changed to: <code class="bg-red-500/10 px-1 rounded text-red-400">{{ test.submissionDetails.newUrl }}</code></span>
                </li>
                <li v-if="test.submissionDetails.indicators?.hasErrorMessage" class="flex items-center space-x-1">
                  <svg class="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Error message detected on page</span>
                </li>
                <li v-if="!test.submissionDetails.indicators?.hasSuccessMessage && !test.submissionDetails.indicators?.formDisappeared && !test.submissionDetails.urlChanged" class="flex items-center space-x-1">
                  <svg class="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>No clear success indicators found</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Flow Chart -->
    <div v-if="report.flowChart" class="glass-card p-8">
      <div class="flex items-center space-x-3 mb-6">
        <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-white">Navigation Flow</h3>
      </div>
      <div class="bg-gray-800/30 p-6 rounded-lg border border-gray-700/50 overflow-x-auto">
        <div ref="mermaidContainer" class="mermaid mermaid-dark">
          {{ report.flowChart }}
        </div>
      </div>
    </div>

    <!-- Bug Reports -->
    <div v-if="report.bugs && report.bugs.length > 0" class="glass-card p-8">
      <div class="flex items-center space-x-3 mb-6">
        <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-white">Bug Reports</h3>
      </div>

      <div class="space-y-6">
        <div
          v-for="bug in report.bugs"
          :key="bug.id"
          class="border rounded-lg p-6"
          :class="getBugBorderClass(bug.severity)"
        >
          <!-- Bug Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <span class="text-xl font-bold text-white">Bug #{{ bug.bugNumber }}</span>
                <span :class="getSeverityBadge(bug.severity)" class="px-3 py-1 rounded text-xs font-bold">
                  {{ bug.severity.toUpperCase() }}
                </span>
                <span :class="getBugTypeClass(bug.type)" class="px-3 py-1 rounded text-xs font-medium border">
                  {{ formatBugType(bug.type) }}
                </span>
              </div>
              <h4 class="text-lg font-bold text-white mb-2">{{ bug.title }}</h4>
              <p class="text-gray-400 text-sm">{{ bug.description }}</p>
            </div>
          </div>

          <!-- Screenshot -->
          <div v-if="bug.screenshot" class="mb-6">
            <div class="flex items-center space-x-2 mb-3">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h5 class="font-semibold text-gray-300 text-sm">Visual Evidence:</h5>
            </div>
            <div class="bg-gray-900/50 rounded-lg p-2 overflow-hidden border border-gray-700/50">
              <img
                :src="'data:image/png;base64,' + bug.screenshot"
                alt="Bug screenshot"
                class="w-full rounded shadow-lg cursor-pointer hover:opacity-90 transition"
                @click="openScreenshot(bug.screenshot)"
              />
            </div>
          </div>

          <!-- Steps to Reproduce -->
          <div v-if="bug.stepsToReproduce" class="mb-4">
            <div class="flex items-center space-x-2 mb-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h5 class="font-semibold text-gray-300 text-sm">Steps to Reproduce:</h5>
            </div>
            <ol class="list-decimal list-inside space-y-1 text-gray-400 text-sm bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
              <li v-for="(step, index) in bug.stepsToReproduce" :key="index">{{ step }}</li>
            </ol>
          </div>

          <!-- Location -->
          <div class="flex items-center space-x-2 text-sm text-gray-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span class="font-mono text-xs">{{ bug.url }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- No Bugs Found -->
    <div v-else class="glass-card p-12 text-center">
      <div class="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
        <svg class="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-white mb-2">No Bugs Found!</h3>
      <p class="text-gray-400">Your application passed all AI tests without any detected issues.</p>
    </div>

    <!-- Download Report Button -->
    <div class="flex justify-center pt-4">
      <button
        @click="downloadReport"
        class="btn-primary px-8 py-4 text-sm flex items-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Download Full Report</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import mermaid from 'mermaid';
import { marked } from 'marked';
import { jsPDF } from 'jspdf';

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

// Initialize Mermaid with dark theme
onMounted(async () => {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#3b82f6',
      primaryTextColor: '#e5e7eb',
      primaryBorderColor: '#1e40af',
      lineColor: '#6b7280',
      secondaryColor: '#8b5cf6',
      tertiaryColor: '#10b981',
      background: '#1f2937',
      mainBkg: '#1f2937',
      nodeBorder: '#4b5563',
      clusterBkg: '#374151',
      clusterBorder: '#6b7280',
      titleColor: '#f3f4f6',
      edgeLabelBackground: '#374151',
      nodeTextColor: '#f3f4f6'
    }
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
  if (severity === 'high') return 'border-red-500/50 bg-red-500/5';
  if (severity === 'medium') return 'border-orange-500/50 bg-orange-500/5';
  if (severity === 'low') return 'border-yellow-500/50 bg-yellow-500/5';
  return 'border-gray-600 bg-gray-800/30';
};

// Get severity badge class
const getSeverityBadge = (severity) => {
  if (severity === 'high') return 'bg-red-500 text-white border border-red-400';
  if (severity === 'medium') return 'bg-orange-500 text-white border border-orange-400';
  if (severity === 'low') return 'bg-yellow-500 text-white border border-yellow-400';
  return 'bg-gray-500 text-white border border-gray-400';
};

// Format bug type for display
const formatBugType = (type) => {
  const typeMap = {
    'security-issue': '🔒 Security',
    'layout-issue': '📐 Layout',
    'text-issue': '📝 Typography',
    'color-contrast': '🎨 Color',
    'design-issue': '✨ Design',
    'responsive-issue': '📱 Mobile',
    'ux-issue': '🖱️ UX',
    'visual-issue': '👁️ Visual',
    'console-error': '⚠️ Console',
    'default': type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  };
  return typeMap[type] || typeMap['default'];
};

// Get bug type styling class
const getBugTypeClass = (type) => {
  const classMap = {
    'security-issue': 'bg-red-700/50 text-red-300 border-red-600',
    'layout-issue': 'bg-purple-700/50 text-purple-300 border-purple-600',
    'text-issue': 'bg-blue-700/50 text-blue-300 border-blue-600',
    'color-contrast': 'bg-pink-700/50 text-pink-300 border-pink-600',
    'design-issue': 'bg-indigo-700/50 text-indigo-300 border-indigo-600',
    'responsive-issue': 'bg-cyan-700/50 text-cyan-300 border-cyan-600',
    'ux-issue': 'bg-green-700/50 text-green-300 border-green-600',
    'visual-issue': 'bg-yellow-700/50 text-yellow-300 border-yellow-600',
    'console-error': 'bg-orange-700/50 text-orange-300 border-orange-600'
  };
  return classMap[type] || 'bg-gray-700/50 text-gray-300 border-gray-600';
};

// Open screenshot in new window
const openScreenshot = (screenshot) => {
  const win = window.open();
  win.document.write(`<img src="data:image/png;base64,${screenshot}" style="max-width:100%; height:auto; background:#000;" />`);
};

// Download report as PDF - Clean structured approach using jsPDF directly
const downloadReport = async () => {
  try {
    // Show loading state
    const button = document.querySelector('button');
    const originalText = button ? button.innerHTML : '';
    if (button) {
      button.innerHTML = '<svg class="animate-spin w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating PDF...';
      button.disabled = true;
    }

    console.log('Creating structured PDF with jsPDF...');

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Page settings
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper to check if we need a new page
    const checkPageBreak = (neededHeight) => {
      if (yPos + neededHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Helper to sanitize text for jsPDF (remove special chars that cause encoding issues)
    const sanitizeText = (text) => {
      if (!text) return '';
      // Remove or replace problematic characters
      return String(text)
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular quotes
        .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
        .replace(/\u2013/g, '-') // En dash
        .replace(/\u2014/g, '--') // Em dash
        .replace(/\u2026/g, '...') // Ellipsis
        .replace(/[\uD800-\uDFFF]/g, '') // Remove unpaired surrogates
        .normalize('NFKD') // Normalize unicode
        .replace(/[^\x00-\x7F]/g, (char) => { // Handle remaining non-ASCII
          // Keep common characters, remove others
          const code = char.charCodeAt(0);
          if (code > 127 && code < 256) return char;
          return '';
        });
    };

    // Helper to add text with word wrap
    const addText = (text, fontSize, fontStyle = 'normal', color = [0, 0, 0]) => {
      const cleanText = sanitizeText(text);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.setTextColor(...color);

      const lines = doc.splitTextToSize(cleanText, maxWidth);
      const lineHeight = fontSize * 0.4;

      checkPageBreak(lines.length * lineHeight + 5);

      lines.forEach(line => {
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      });

      yPos += 3; // Extra spacing after paragraph
    };

    // Header Section
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitizeText('BugHunter AI Test Report'), margin, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizeText('AI-Powered Web Testing & Bug Detection'), margin, 30);

    yPos = 50;

    // Calculate statistics - with safe array checks
    const bugsArray = Array.isArray(props.report.bugs) ? props.report.bugs : [];
    const testCasesArray = Array.isArray(props.report.testCases) ? props.report.testCases : [];
    const navigationArray = Array.isArray(props.report.navigationHistory) ? props.report.navigationHistory : [];
    const screenshotsArray = Array.isArray(props.report.screenshots) ? props.report.screenshots : [];

    const bugsBySeverity = {
      high: bugsArray.filter(b => b.severity === 'high').length,
      medium: bugsArray.filter(b => b.severity === 'medium').length,
      low: bugsArray.filter(b => b.severity === 'low').length
    };
    const testCaseStats = {
      passed: testCasesArray.filter(tc => tc.status === 'PASSED').length,
      failed: testCasesArray.filter(tc => tc.status === 'FAILED').length,
      total: testCasesArray.length
    };
    const pagesVisited = navigationArray.length;
    const screenshotCount = screenshotsArray.length || bugsArray.filter(b => b.screenshot).length;

    // Report Summary Section - Enhanced
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, maxWidth, 55, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(margin, yPos, maxWidth, 55, 'S');

    yPos += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitizeText('Test Summary & Statistics'), margin + 5, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Left column
    doc.text(sanitizeText(`Target URL: ${props.report.targetUrl || 'N/A'}`), margin + 5, yPos);
    yPos += 6;
    doc.text(sanitizeText(`Total Bugs Found: ${props.report.bugsFound || 0}`), margin + 5, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38);
    doc.text(sanitizeText(`  High: ${bugsBySeverity.high}`), margin + 8, yPos);
    yPos += 4;
    doc.setTextColor(234, 179, 8);
    doc.text(sanitizeText(`  Medium: ${bugsBySeverity.medium}`), margin + 8, yPos);
    yPos += 4;
    doc.setTextColor(34, 197, 94);
    doc.text(sanitizeText(`  Low: ${bugsBySeverity.low}`), margin + 8, yPos);

    yPos -= 13; // Reset to same line as Total Bugs
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(sanitizeText(`Pages Visited: ${pagesVisited}`), margin + 95, yPos);
    yPos += 6;
    doc.text(sanitizeText(`Screenshots: ${screenshotCount}`), margin + 95, yPos);
    yPos += 6;
    doc.text(sanitizeText(`Test Cases: ${testCaseStats.total}`), margin + 95, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(34, 197, 94);
    doc.text(sanitizeText(`  Passed: ${testCaseStats.passed}`), margin + 98, yPos);
    yPos += 4;
    doc.setTextColor(220, 38, 38);
    doc.text(sanitizeText(`  Failed: ${testCaseStats.failed}`), margin + 98, yPos);

    yPos += 12;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(sanitizeText(`Duration: ${props.report.duration || 'N/A'}`), margin + 5, yPos);

    yPos += 18;

    // Website Analysis Section - Enhanced
    if (props.report.websiteAnalysis) {
      checkPageBreak(35);

      // Analysis header box
      doc.setFillColor(219, 234, 254); // Light blue background
      doc.rect(margin, yPos, maxWidth, 10, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos, maxWidth, 10, 'S');

      yPos += 7;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(sanitizeText('AI Website Analysis'), margin + 5, yPos);

      yPos += 8;

      // Analysis content box
      const analysisLines = doc.splitTextToSize(sanitizeText(props.report.websiteAnalysis), maxWidth - 10);
      const analysisHeight = analysisLines.length * 4 + 10;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.rect(margin, yPos, maxWidth, analysisHeight, 'FD');

      yPos += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);

      analysisLines.forEach(line => {
        doc.text(line, margin + 5, yPos);
        yPos += 4;
      });

      yPos += 10;
    }

    // Bugs Section
    if (props.report.bugs && props.report.bugs.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Red
      doc.text(sanitizeText(`Bugs Detected (${props.report.bugs.length})`), margin, yPos);
      yPos += 10;

      for (let index = 0; index < props.report.bugs.length; index++) {
        const bug = props.report.bugs[index];
        const hasScreenshot = bug.screenshot && bug.screenshot.length > 0;
        const screenshotHeight = hasScreenshot ? 60 : 0;
        const cardHeight = 25 + screenshotHeight;

        checkPageBreak(cardHeight + 10);

        // Bug card background
        doc.setFillColor(254, 242, 242); // Light red background
        doc.rect(margin, yPos, maxWidth, cardHeight, 'F');
        doc.setDrawColor(252, 165, 165);
        doc.rect(margin, yPos, maxWidth, cardHeight, 'S');

        // Bug number and severity
        let cardYPos = yPos + 6;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(153, 27, 27);
        doc.text(sanitizeText(`Bug #${index + 1}`), margin + 3, cardYPos);

        // Severity badge
        const severityColor = bug.severity === 'high' ? [220, 38, 38] :
                             bug.severity === 'medium' ? [234, 179, 8] : [34, 197, 94];
        doc.setFillColor(...severityColor);
        doc.roundedRect(maxWidth - 25, cardYPos - 4, 20, 6, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(sanitizeText((bug.severity || 'low').toUpperCase()), maxWidth - 23, cardYPos);

        // Bug title
        cardYPos += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        const titleLines = doc.splitTextToSize(sanitizeText(bug.title || 'Untitled Bug'), maxWidth - 10);
        doc.text(titleLines[0], margin + 3, cardYPos);

        // Bug description
        cardYPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
        const descLines = doc.splitTextToSize(sanitizeText(bug.description || 'No description'), maxWidth - 10);
        doc.text(descLines.slice(0, 2), margin + 3, cardYPos);

        // Add screenshot if available
        if (hasScreenshot) {
          cardYPos += 8;
          try {
            const imgWidth = maxWidth - 10;
            const imgHeight = 50;
            doc.addImage(
              `data:image/png;base64,${bug.screenshot}`,
              'PNG',
              margin + 5,
              cardYPos,
              imgWidth,
              imgHeight
            );
          } catch (error) {
            console.error('Error adding screenshot to PDF:', error);
          }
        }

        yPos += cardHeight + 5;
      }

      yPos += 5;
    }

    // Test Cases Section
    if (props.report.testCases && props.report.testCases.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246); // Blue
      doc.text(sanitizeText(`Test Cases (${props.report.testCases.length})`), margin, yPos);
      yPos += 10;

      props.report.testCases.forEach((testCase, index) => {
        checkPageBreak(20);

        // Test case row
        const statusColor = testCase.status === 'PASSED' ? [34, 197, 94] :
                           testCase.status === 'FAILED' ? [220, 38, 38] : [234, 179, 8];

        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPos, maxWidth, 12, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.rect(margin, yPos, maxWidth, 12, 'S');

        // Status badge
        yPos += 4;
        doc.setFillColor(...statusColor);
        doc.circle(margin + 3, yPos, 1.5, 'F');

        // Test number and action
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(sanitizeText(`Test ${index + 1}:`), margin + 7, yPos);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const actionText = `${testCase.action || 'Unknown'} - ${testCase.selector || 'N/A'}`;
        const actionLines = doc.splitTextToSize(sanitizeText(actionText), maxWidth - 30);
        doc.text(actionLines[0], margin + 20, yPos);

        yPos += 10;
      });

      yPos += 5;
    }

    // Footer on last page
    const timestamp = new Date().toLocaleString();
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(sanitizeText(`Generated by BugHunter AI - ${timestamp}`), margin, pageHeight - 10);

    // Add page numbers to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(sanitizeText(`Page ${i} of ${totalPages}`), pageWidth - margin - 20, pageHeight - 10);
    }

    // Save the PDF
    doc.save(`bughunter-report-${Date.now()}.pdf`);

    console.log('PDF generated successfully with', totalPages, 'pages');

    // Restore button
    if (button) {
      button.innerHTML = originalText;
      button.disabled = false;
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    alert(`Failed to generate PDF: ${error.message}\n\nPlease check console for details.`);

    // Restore button
    const button = document.querySelector('button');
    if (button) {
      button.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg><span>Download Full Report</span>';
      button.disabled = false;
    }
  }
};
</script>

<style scoped>
/* Markdown content styling for dark theme */
.markdown-content :deep(h1) {
  @apply text-2xl font-bold text-white mb-4 mt-6;
}

.markdown-content :deep(h2) {
  @apply text-xl font-bold text-gray-200 mb-3 mt-5;
}

.markdown-content :deep(h3) {
  @apply text-lg font-bold text-gray-300 mb-2 mt-4;
}

.markdown-content :deep(p) {
  @apply text-gray-400 mb-3 leading-relaxed;
}

.markdown-content :deep(ul) {
  @apply list-disc list-inside mb-3 space-y-1;
}

.markdown-content :deep(ol) {
  @apply list-decimal list-inside mb-3 space-y-1;
}

.markdown-content :deep(li) {
  @apply text-gray-400 ml-2;
}

.markdown-content :deep(strong) {
  @apply font-bold text-white;
}

.markdown-content :deep(em) {
  @apply italic text-gray-300;
}

.markdown-content :deep(code) {
  @apply bg-gray-800 px-2 py-1 rounded text-sm font-mono text-blue-400;
}

.markdown-content :deep(blockquote) {
  @apply border-l-4 border-blue-500 pl-4 italic text-gray-500 my-3;
}

/* Mermaid dark theme support */
.mermaid-dark {
  @apply text-gray-300;
}

/* Print/PDF Styles - Convert to Light Theme */
@media print {
  * {
    background: white !important;
    color: #1a1a1a !important;
    border-color: #e5e7eb !important;
    backdrop-filter: none !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
  }

  /* Glass cards become solid light cards */
  .glass-card {
    background: #f9fafb !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
  }

  /* Headers */
  h1, h2, h3, h4, h5, h6 {
    color: #111827 !important;
  }

  /* Text colors */
  .text-white, .text-gray-300, .text-gray-400 {
    color: #1a1a1a !important;
  }

  .text-gray-500, .text-gray-600 {
    color: #4b5563 !important;
  }

  /* Colored accents */
  .text-green-400, .text-green-500 {
    color: #059669 !important;
  }

  .text-yellow-400, .text-yellow-500 {
    color: #d97706 !important;
  }

  .text-red-400, .text-red-500 {
    color: #dc2626 !important;
  }

  .text-blue-400, .text-blue-500 {
    color: #2563eb !important;
  }

  /* Code blocks */
  pre, code {
    background: #f3f4f6 !important;
    color: #1f2937 !important;
    border: 1px solid #d1d5db !important;
  }

  /* Badges and buttons */
  .bg-green-500\/20, .bg-yellow-500\/20, .bg-red-500\/20, .bg-blue-500\/20 {
    background: #f3f4f6 !important;
  }

  /* Remove animations and transitions */
  * {
    animation: none !important;
    transition: none !important;
  }

  /* Bug cards */
  .bug-card {
    background: white !important;
    border: 1px solid #e5e7eb !important;
    page-break-inside: avoid;
  }

  /* Images and screenshots */
  img {
    max-width: 100%;
    page-break-inside: avoid;
  }

  /* Hide interactive elements */
  button {
    display: none !important;
  }

  /* Ensure page breaks work */
  .glass-card {
    page-break-inside: avoid;
  }
}
</style>
