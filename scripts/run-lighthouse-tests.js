#!/usr/bin/env node

// Lighthouse Performance Testing Script
// Runs comprehensive performance tests and generates reports

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Configuration
const config = {
  serverUrl: 'http://localhost:4000',
  outputDir: './lighthouse-reports',
  urls: [
    '/', 
    '/dashboard', 
    '/drivers', 
    '/vehicles', 
    '/settings', 
    '/login'
  ],
  chromeFlags: [
    '--headless',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--remote-debugging-port=9222'
  ],
  thresholds: {
    performance: 75,
    accessibility: 85,
    bestPractices: 80,
    seo: 80,
    pwa: 60
  },
  runs: 3
};

async function checkServerHealth() {
  console.log('🔍 Checking server health...');
  
  try {
    const response = await fetch(`${config.serverUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`Server health check failed: ${response.status}`);
    }
    console.log('✅ Server is healthy and ready for testing');
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    console.log('💡 Make sure the development server is running on port 4000');
    return false;
  }
}

async function ensureOutputDirectory() {
  try {
    await fs.promises.mkdir(config.outputDir, { recursive: true });
    console.log(`📁 Output directory ready: ${config.outputDir}`);
  } catch (error) {
    console.error('Failed to create output directory:', error);
    process.exit(1);
  }
}

async function runLighthouseAudit(url, index) {
  const fullUrl = `${config.serverUrl}${url}`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(
    config.outputDir, 
    `lighthouse-${url.replace(/\//g, '_') || 'root'}-${timestamp}.html`
  );
  
  console.log(`🚀 Running Lighthouse audit for ${fullUrl}...`);
  
  const startTime = performance.now();
  
  try {
    const command = [
      'npx lighthouse',
      fullUrl,
      '--chrome-flags=' + config.chromeFlags.join(' '),
      '--output=html',
      '--output=json',
      `--output-path=${outputFile.replace('.html', '')}`,
      '--quiet',
      '--no-enable-error-reporting'
    ].join(' ');
    
    execSync(command, { 
      stdio: 'pipe',
      timeout: 120000 // 2 minutes timeout
    });
    
    const duration = Math.round(performance.now() - startTime);
    console.log(`✅ Audit completed for ${url} (${duration}ms)`);
    
    // Parse JSON results for scoring
    const jsonFile = outputFile.replace('.html', '.json');
    if (fs.existsSync(jsonFile)) {
      const results = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      return {
        url,
        scores: {
          performance: Math.round(results.lhr.categories.performance.score * 100),
          accessibility: Math.round(results.lhr.categories.accessibility.score * 100),
          bestPractices: Math.round(results.lhr.categories['best-practices'].score * 100),
          seo: Math.round(results.lhr.categories.seo.score * 100),
          pwa: results.lhr.categories.pwa ? Math.round(results.lhr.categories.pwa.score * 100) : 0
        },
        metrics: {
          firstContentfulPaint: results.lhr.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint: results.lhr.audits['largest-contentful-paint'].numericValue,
          totalBlockingTime: results.lhr.audits['total-blocking-time'].numericValue,
          cumulativeLayoutShift: results.lhr.audits['cumulative-layout-shift'].numericValue,
          speedIndex: results.lhr.audits['speed-index'].numericValue
        },
        duration,
        outputFile: outputFile.replace('.html', '.json')
      };
    }
    
    return { url, error: 'No JSON results found', duration };
    
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    console.error(`❌ Audit failed for ${url}:`, error.message);
    return { 
      url, 
      error: error.message, 
      duration 
    };
  }
}

function generateSummaryReport(results) {
  console.log('\n📊 LIGHTHOUSE PERFORMANCE SUMMARY');
  console.log('=' .repeat(60));
  
  const summaryData = {
    totalUrls: results.length,
    passedUrls: 0,
    failedUrls: 0,
    averageScores: {
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      pwa: 0
    },
    issues: []
  };
  
  results.forEach(result => {
    if (result.error) {
      summaryData.failedUrls++;
      summaryData.issues.push(`${result.url}: ${result.error}`);
      return;
    }
    
    summaryData.passedUrls++;
    
    // Add to averages
    Object.keys(summaryData.averageScores).forEach(key => {
      summaryData.averageScores[key] += result.scores[key] || 0;
    });
    
    // Check thresholds
    Object.entries(config.thresholds).forEach(([category, threshold]) => {
      const score = result.scores[category] || 0;
      if (score < threshold) {
        summaryData.issues.push(
          `${result.url}: ${category} score ${score} is below threshold ${threshold}`
        );
      }
    });
    
    console.log(`\n📄 ${result.url}`);
    console.log(`   Performance: ${result.scores.performance}%`);
    console.log(`   Accessibility: ${result.scores.accessibility}%`);
    console.log(`   Best Practices: ${result.scores.bestPractices}%`);
    console.log(`   SEO: ${result.scores.seo}%`);
    if (result.scores.pwa > 0) {
      console.log(`   PWA: ${result.scores.pwa}%`);
    }
    console.log(`   Duration: ${result.duration}ms`);
  });
  
  // Calculate averages
  if (summaryData.passedUrls > 0) {
    Object.keys(summaryData.averageScores).forEach(key => {
      summaryData.averageScores[key] = Math.round(
        summaryData.averageScores[key] / summaryData.passedUrls
      );
    });
  }
  
  console.log('\n📈 OVERALL AVERAGES');
  console.log('-'.repeat(30));
  console.log(`Performance: ${summaryData.averageScores.performance}%`);
  console.log(`Accessibility: ${summaryData.averageScores.accessibility}%`);
  console.log(`Best Practices: ${summaryData.averageScores.bestPractices}%`);
  console.log(`SEO: ${summaryData.averageScores.seo}%`);
  console.log(`PWA: ${summaryData.averageScores.pwa}%`);
  
  if (summaryData.issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND');
    console.log('-'.repeat(30));
    summaryData.issues.forEach(issue => {
      console.log(`❌ ${issue}`);
    });
  }
  
  console.log(`\n✅ ${summaryData.passedUrls}/${summaryData.totalUrls} URLs tested successfully`);
  
  // Write summary to file
  const summaryFile = path.join(config.outputDir, `summary-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summaryData, null, 2));
  console.log(`\n📝 Full summary saved to: ${summaryFile}`);
  
  return summaryData.issues.length === 0;
}

async function main() {
  console.log('🏗️  Starting Lighthouse Performance Tests');
  console.log('=' .repeat(60));
  
  // Check if server is running
  const isServerReady = await checkServerHealth();
  if (!isServerReady) {
    process.exit(1);
  }
  
  // Ensure output directory exists
  await ensureOutputDirectory();
  
  // Run audits for all URLs
  console.log(`\n🎯 Testing ${config.urls.length} URLs with ${config.runs} runs each...`);
  
  const allResults = [];
  
  for (const url of config.urls) {
    const result = await runLighthouseAudit(url);
    allResults.push(result);
    
    // Brief pause between audits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate summary report
  const allTestsPassed = generateSummaryReport(allResults);
  
  console.log('\n🏁 Lighthouse testing completed!');
  console.log(`📂 Reports saved to: ${path.resolve(config.outputDir)}`);
  
  // Exit with appropriate code
  process.exit(allTestsPassed ? 0 : 1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Lighthouse tests interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Lighthouse tests terminated');
  process.exit(1);
});

// Add fetch polyfill for Node.js versions that don't have it
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Lighthouse testing failed:', error);
    process.exit(1);
  });
}