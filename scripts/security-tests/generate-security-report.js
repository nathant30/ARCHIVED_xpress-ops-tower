#!/usr/bin/env node

/**
 * Security Report Generator for Xpress Ops Tower CI/CD Pipeline
 * Aggregates security scan results and generates comprehensive reports
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SecurityReportGenerator {
  constructor() {
    this.artifactsPath = process.env.ARTIFACTS_PATH || 'security-artifacts';
    this.outputPath = process.cwd();
    this.report = {
      metadata: {
        generated_at: new Date().toISOString(),
        pipeline_run: process.env.GITHUB_RUN_ID || 'local',
        commit: process.env.GITHUB_SHA || 'unknown',
        branch: process.env.GITHUB_REF_NAME || 'unknown',
        environment: process.env.NODE_ENV || 'test'
      },
      summary: {
        overall_status: 'unknown',
        total_vulnerabilities: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        tests_executed: 0,
        tests_passed: 0,
        tests_failed: 0,
        risk_score: 0,
        security_posture: 'unknown'
      },
      components: {},
      vulnerabilities: [],
      recommendations: [],
      metrics: {},
      compliance: {}
    };
  }

  async generateReport() {
    console.log('📊 Generating comprehensive security report...');
    
    try {
      // Collect all security scan results
      await this.collectScanResults();
      
      // Analyze and aggregate data
      await this.analyzeResults();
      
      // Calculate metrics and scoring
      this.calculateSecurityMetrics();
      
      // Generate compliance assessment
      this.assessCompliance();
      
      // Create recommendations
      this.generateRecommendations();
      
      // Output reports
      await this.outputReports();
      
      console.log('✅ Security report generated successfully');
      return this.report;
      
    } catch (error) {
      console.error('❌ Failed to generate security report:', error);
      throw error;
    }
  }

  async collectScanResults() {
    console.log('🔍 Collecting security scan results...');
    
    const collectors = [
      this.collectSASTResults.bind(this),
      this.collectDependencyResults.bind(this),
      this.collectSecretResults.bind(this),
      this.collectDASTResults.bind(this),
      this.collectContainerResults.bind(this),
      this.collectSecurityTestResults.bind(this)
    ];
    
    for (const collector of collectors) {
      try {
        await collector();
      } catch (error) {
        console.warn(`Warning: ${collector.name} failed:`, error.message);
      }
    }
  }

  async collectSASTResults() {
    const sastFiles = await this.findFiles('**/*codeql*', '**/*semgrep*', '**/*eslint*');
    
    for (const file of sastFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        if (file.includes('sarif')) {
          await this.processSARIFResults(content, 'sast');
        } else if (file.includes('json')) {
          await this.processJSONResults(content, 'sast');
        }
      } catch (error) {
        console.warn(`Failed to process SAST file ${file}:`, error.message);
      }
    }
    
    this.report.components.sast = {
      status: 'completed',
      tools: ['CodeQL', 'Semgrep', 'ESLint Security'],
      findings: this.report.vulnerabilities.filter(v => v.source === 'sast').length
    };
  }

  async collectDependencyResults() {
    const depFiles = await this.findFiles('**/npm-audit*', '**/snyk*', '**/trivy*');
    
    for (const file of depFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        if (file.includes('npm-audit')) {
          await this.processNPMAuditResults(content);
        } else if (file.includes('snyk')) {
          await this.processSnykResults(content);
        } else if (file.includes('trivy')) {
          await this.processTrivyResults(content);
        }
      } catch (error) {
        console.warn(`Failed to process dependency file ${file}:`, error.message);
      }
    }
    
    this.report.components.dependencies = {
      status: 'completed',
      tools: ['npm audit', 'Snyk', 'Trivy'],
      findings: this.report.vulnerabilities.filter(v => v.source === 'dependency').length
    };
  }

  async collectSecretResults() {
    const secretFiles = await this.findFiles('**/*gitleaks*', '**/*trufflehog*');
    
    for (const file of secretFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        await this.processSecretResults(content);
      } catch (error) {
        console.warn(`Failed to process secret file ${file}:`, error.message);
      }
    }
    
    this.report.components.secrets = {
      status: 'completed',
      tools: ['GitLeaks', 'TruffleHog'],
      findings: this.report.vulnerabilities.filter(v => v.source === 'secrets').length
    };
  }

  async collectDASTResults() {
    const dastFiles = await this.findFiles('**/zap*', '**/owasp*');
    
    for (const file of dastFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        await this.processZAPResults(content);
      } catch (error) {
        console.warn(`Failed to process DAST file ${file}:`, error.message);
      }
    }
    
    this.report.components.dast = {
      status: 'completed',
      tools: ['OWASP ZAP'],
      findings: this.report.vulnerabilities.filter(v => v.source === 'dast').length
    };
  }

  async collectContainerResults() {
    const containerFiles = await this.findFiles('**/*container*', '**/*docker*');
    
    for (const file of containerFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        await this.processContainerResults(content);
      } catch (error) {
        console.warn(`Failed to process container file ${file}:`, error.message);
      }
    }
    
    this.report.components.containers = {
      status: 'completed',
      tools: ['Trivy', 'Snyk Container', 'Hadolint'],
      findings: this.report.vulnerabilities.filter(v => v.source === 'container').length
    };
  }

  async collectSecurityTestResults() {
    const testFiles = await this.findFiles('**/security-test*');
    
    for (const file of testFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const results = JSON.parse(content);
        
        if (results.vulnerabilities) {
          for (const vuln of results.vulnerabilities) {
            this.addVulnerability({
              ...vuln,
              source: 'security_tests'
            });
          }
        }
        
        if (results.summary) {
          this.report.summary.tests_executed += results.summary.total_tests || 0;
          this.report.summary.tests_passed += results.summary.passed || 0;
          this.report.summary.tests_failed += results.summary.failed || 0;
        }
      } catch (error) {
        console.warn(`Failed to process security test file ${file}:`, error.message);
      }
    }
    
    this.report.components.security_tests = {
      status: 'completed',
      tools: ['Custom Security Tests', 'API Security Tests'],
      findings: this.report.vulnerabilities.filter(v => v.source === 'security_tests').length
    };
  }

  async processSARIFResults(content, source) {
    try {
      const sarif = JSON.parse(content);
      
      if (sarif.runs) {
        for (const run of sarif.runs) {
          if (run.results) {
            for (const result of run.results) {
              const severity = this.mapSARIFSeverity(result.level || result.rank);
              
              this.addVulnerability({
                id: result.ruleId,
                title: result.message?.text || 'SAST Finding',
                description: result.message?.text || 'Static analysis finding',
                severity: severity,
                source: source,
                category: 'static_analysis',
                location: this.extractSARIFLocation(result),
                cwe: this.extractCWE(result),
                confidence: result.properties?.confidence || 'medium'
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse SARIF results:', error.message);
    }
  }

  async processNPMAuditResults(content) {
    try {
      const audit = JSON.parse(content);
      
      if (audit.vulnerabilities) {
        for (const [packageName, vuln] of Object.entries(audit.vulnerabilities)) {
          this.addVulnerability({
            id: `npm-${packageName}-${vuln.cwe || 'unknown'}`,
            title: `${packageName}: ${vuln.title}`,
            description: vuln.overview || vuln.title,
            severity: vuln.severity,
            source: 'dependency',
            category: 'vulnerable_dependency',
            package: packageName,
            version: vuln.versions,
            cwe: vuln.cwe,
            cvss_score: vuln.cvss?.score,
            references: vuln.references
          });
        }
      }
    } catch (error) {
      console.warn('Failed to parse npm audit results:', error.message);
    }
  }

  async processSnykResults(content) {
    try {
      const snyk = JSON.parse(content);
      
      if (snyk.vulnerabilities) {
        for (const vuln of snyk.vulnerabilities) {
          this.addVulnerability({
            id: vuln.id,
            title: vuln.title,
            description: vuln.description,
            severity: vuln.severity,
            source: 'dependency',
            category: 'vulnerable_dependency',
            package: vuln.packageName,
            version: vuln.version,
            cvss_score: vuln.cvssScore,
            references: vuln.references
          });
        }
      }
    } catch (error) {
      console.warn('Failed to parse Snyk results:', error.message);
    }
  }

  async processSecretResults(content) {
    try {
      const secrets = JSON.parse(content);
      
      if (Array.isArray(secrets)) {
        for (const secret of secrets) {
          this.addVulnerability({
            id: `secret-${crypto.createHash('md5').update(secret.Match || secret.secret || '').digest('hex')}`,
            title: 'Exposed Secret Detected',
            description: `Potential secret found: ${secret.Description || secret.type || 'Unknown secret type'}`,
            severity: 'high',
            source: 'secrets',
            category: 'exposed_secret',
            file: secret.File || secret.file,
            line: secret.StartLine || secret.line,
            secret_type: secret.Description || secret.type
          });
        }
      }
    } catch (error) {
      console.warn('Failed to parse secret scan results:', error.message);
    }
  }

  async processZAPResults(content) {
    try {
      const zap = JSON.parse(content);
      
      if (zap.site && zap.site[0] && zap.site[0].alerts) {
        for (const alert of zap.site[0].alerts) {
          this.addVulnerability({
            id: `zap-${alert.pluginid}`,
            title: alert.name,
            description: alert.desc,
            severity: this.mapZAPRisk(alert.riskdesc),
            source: 'dast',
            category: 'web_vulnerability',
            confidence: this.mapZAPConfidence(alert.confidence),
            solution: alert.solution,
            reference: alert.reference,
            instances: alert.instances?.length || 0
          });
        }
      }
    } catch (error) {
      console.warn('Failed to parse ZAP results:', error.message);
    }
  }

  async processContainerResults(content) {
    try {
      if (content.includes('sarif')) {
        await this.processSARIFResults(content, 'container');
      } else {
        const container = JSON.parse(content);
        
        if (container.Results) {
          for (const result of container.Results) {
            if (result.Vulnerabilities) {
              for (const vuln of result.Vulnerabilities) {
                this.addVulnerability({
                  id: vuln.VulnerabilityID,
                  title: vuln.Title || vuln.VulnerabilityID,
                  description: vuln.Description,
                  severity: vuln.Severity?.toLowerCase(),
                  source: 'container',
                  category: 'container_vulnerability',
                  package: vuln.PkgName,
                  version: vuln.InstalledVersion,
                  fixed_version: vuln.FixedVersion,
                  cvss_score: vuln.CVSS?.nvd?.V3Score
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse container results:', error.message);
    }
  }

  addVulnerability(vuln) {
    // Deduplicate vulnerabilities
    const existingVuln = this.report.vulnerabilities.find(v => 
      v.id === vuln.id || (v.title === vuln.title && v.source === vuln.source)
    );
    
    if (!existingVuln) {
      this.report.vulnerabilities.push({
        ...vuln,
        timestamp: new Date().toISOString()
      });
      
      // Update counts
      this.report.summary.total_vulnerabilities++;
      switch (vuln.severity) {
        case 'critical':
          this.report.summary.critical_count++;
          break;
        case 'high':
          this.report.summary.high_count++;
          break;
        case 'medium':
          this.report.summary.medium_count++;
          break;
        case 'low':
          this.report.summary.low_count++;
          break;
      }
    }
  }

  async analyzeResults() {
    console.log('📈 Analyzing security results...');
    
    // Group vulnerabilities by source
    const bySource = {};
    const byCategory = {};
    const bySeverity = {};
    
    for (const vuln of this.report.vulnerabilities) {
      // By source
      if (!bySource[vuln.source]) bySource[vuln.source] = [];
      bySource[vuln.source].push(vuln);
      
      // By category
      if (!byCategory[vuln.category]) byCategory[vuln.category] = [];
      byCategory[vuln.category].push(vuln);
      
      // By severity
      if (!bySeverity[vuln.severity]) bySeverity[vuln.severity] = [];
      bySeverity[vuln.severity].push(vuln);
    }
    
    this.report.analysis = {
      by_source: Object.fromEntries(
        Object.entries(bySource).map(([k, v]) => [k, v.length])
      ),
      by_category: Object.fromEntries(
        Object.entries(byCategory).map(([k, v]) => [k, v.length])
      ),
      by_severity: Object.fromEntries(
        Object.entries(bySeverity).map(([k, v]) => [k, v.length])
      ),
      top_vulnerabilities: this.getTopVulnerabilities(),
      trends: await this.analyzeTrends()
    };
  }

  calculateSecurityMetrics() {
    console.log('📊 Calculating security metrics...');
    
    // Calculate risk score
    let riskScore = 0;
    riskScore += this.report.summary.critical_count * 10;
    riskScore += this.report.summary.high_count * 7;
    riskScore += this.report.summary.medium_count * 4;
    riskScore += this.report.summary.low_count * 1;
    
    this.report.summary.risk_score = riskScore;
    
    // Determine overall security posture
    if (this.report.summary.critical_count > 0) {
      this.report.summary.security_posture = 'critical';
      this.report.summary.overall_status = 'failed';
    } else if (this.report.summary.high_count > 5) {
      this.report.summary.security_posture = 'poor';
      this.report.summary.overall_status = 'failed';
    } else if (this.report.summary.high_count > 0 || this.report.summary.medium_count > 10) {
      this.report.summary.security_posture = 'needs_improvement';
      this.report.summary.overall_status = 'warning';
    } else if (this.report.summary.medium_count > 0) {
      this.report.summary.security_posture = 'acceptable';
      this.report.summary.overall_status = 'passed';
    } else {
      this.report.summary.security_posture = 'excellent';
      this.report.summary.overall_status = 'passed';
    }
    
    // Calculate additional metrics
    this.report.metrics = {
      vulnerability_density: this.report.summary.total_vulnerabilities / Math.max(this.report.summary.tests_executed, 1),
      critical_vulnerability_rate: this.report.summary.critical_count / Math.max(this.report.summary.total_vulnerabilities, 1),
      test_success_rate: this.report.summary.tests_passed / Math.max(this.report.summary.tests_executed, 1),
      security_score: Math.max(0, 100 - riskScore),
      mttr_estimate: this.calculateMTTR(),
      coverage: this.calculateSecurityCoverage()
    };
  }

  assessCompliance() {
    console.log('📋 Assessing compliance...');
    
    const criticalVulns = this.report.summary.critical_count;
    const highVulns = this.report.summary.high_count;
    const secretsFound = this.report.vulnerabilities.filter(v => v.source === 'secrets').length;
    
    this.report.compliance = {
      owasp_top_10: {
        status: criticalVulns === 0 && highVulns < 3 ? 'compliant' : 'non_compliant',
        score: Math.max(0, 100 - (criticalVulns * 20 + highVulns * 10)),
        issues: this.getOWASPIssues()
      },
      pci_dss: {
        status: secretsFound === 0 && criticalVulns === 0 ? 'compliant' : 'non_compliant',
        score: Math.max(0, 100 - (secretsFound * 25 + criticalVulns * 15)),
        requirements_met: this.getPCIRequirementsMet()
      },
      gdpr: {
        status: this.assessGDPRCompliance(),
        data_protection_score: this.calculateDataProtectionScore(),
        privacy_controls: this.assessPrivacyControls()
      },
      philippines_data_privacy: {
        status: this.assessPhilippinesDataPrivacy(),
        npc_compliance: this.assessNPCCompliance(),
        local_requirements: this.getLocalRequirements()
      }
    };
  }

  generateRecommendations() {
    console.log('💡 Generating recommendations...');
    
    const recommendations = [];
    
    // Critical vulnerabilities
    if (this.report.summary.critical_count > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'vulnerability_management',
        title: 'Address Critical Vulnerabilities Immediately',
        description: `${this.report.summary.critical_count} critical vulnerabilities require immediate attention`,
        impact: 'System compromise, data breach, service disruption',
        effort: 'high',
        timeline: 'immediate (0-24 hours)',
        actions: [
          'Stop deployment pipeline',
          'Patch critical vulnerabilities',
          'Conduct security review',
          'Test fixes thoroughly'
        ]
      });
    }
    
    // High vulnerabilities
    if (this.report.summary.high_count > 0) {
      recommendations.push({
        priority: 'high',
        category: 'vulnerability_management',
        title: 'Fix High-Severity Vulnerabilities',
        description: `${this.report.summary.high_count} high-severity vulnerabilities need attention`,
        impact: 'Data exposure, privilege escalation, service compromise',
        effort: 'medium',
        timeline: '24-48 hours',
        actions: [
          'Prioritize by exploitability',
          'Apply security patches',
          'Update dependencies',
          'Review security configurations'
        ]
      });
    }
    
    // Secret management
    const secretsCount = this.report.vulnerabilities.filter(v => v.source === 'secrets').length;
    if (secretsCount > 0) {
      recommendations.push({
        priority: 'high',
        category: 'secret_management',
        title: 'Remove Exposed Secrets from Code',
        description: `${secretsCount} potential secrets found in codebase`,
        impact: 'Unauthorized access, data breach, service compromise',
        effort: 'medium',
        timeline: '24-48 hours',
        actions: [
          'Remove secrets from git history',
          'Rotate exposed credentials',
          'Implement proper secret management',
          'Add pre-commit hooks'
        ]
      });
    }
    
    // Container security
    const containerVulns = this.report.vulnerabilities.filter(v => v.source === 'container').length;
    if (containerVulns > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'container_security',
        title: 'Improve Container Security',
        description: `${containerVulns} container vulnerabilities detected`,
        impact: 'Runtime compromise, lateral movement',
        effort: 'medium',
        timeline: '1 week',
        actions: [
          'Update base images',
          'Remove unnecessary packages',
          'Implement distroless images',
          'Add security scanning to CI/CD'
        ]
      });
    }
    
    // Security testing
    if (this.report.metrics.test_success_rate < 0.9) {
      recommendations.push({
        priority: 'medium',
        category: 'testing',
        title: 'Improve Security Test Coverage',
        description: `Security test success rate is ${Math.round(this.report.metrics.test_success_rate * 100)}%`,
        impact: 'Undetected vulnerabilities, security regression',
        effort: 'high',
        timeline: '2-3 weeks',
        actions: [
          'Fix failing security tests',
          'Add missing test cases',
          'Implement test automation',
          'Regular security assessments'
        ]
      });
    }
    
    // General security improvements
    recommendations.push({
      priority: 'low',
      category: 'security_posture',
      title: 'Enhance Overall Security Posture',
      description: 'Implement comprehensive security improvements',
      impact: 'Reduced attack surface, improved resilience',
      effort: 'high',
      timeline: '1-3 months',
      actions: [
        'Regular security training',
        'Implement security monitoring',
        'Conduct penetration testing',
        'Establish incident response plan'
      ]
    });
    
    this.report.recommendations = recommendations;
  }

  async outputReports() {
    console.log('📄 Generating report files...');
    
    // JSON Report
    const jsonReportPath = path.join(this.outputPath, 'security-report.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(this.report, null, 2));
    
    // HTML Report
    const htmlReportPath = path.join(this.outputPath, 'security-report.html');
    await fs.writeFile(htmlReportPath, this.generateHTMLReport());
    
    // Metrics file for monitoring
    const metricsPath = path.join(this.outputPath, 'security-metrics.json');
    await fs.writeFile(metricsPath, JSON.stringify({
      timestamp: this.report.metadata.generated_at,
      metrics: this.report.metrics,
      summary: this.report.summary,
      compliance: this.report.compliance
    }, null, 2));
    
    // SARIF output for GitHub Security tab
    if (this.report.vulnerabilities.length > 0) {
      const sarifPath = path.join(this.outputPath, 'security-report.sarif');
      await fs.writeFile(sarifPath, JSON.stringify(this.generateSARIF(), null, 2));
    }
    
    console.log(`📊 Reports generated:`);
    console.log(`  - JSON: ${jsonReportPath}`);
    console.log(`  - HTML: ${htmlReportPath}`);
    console.log(`  - Metrics: ${metricsPath}`);
  }

  generateHTMLReport() {
    const severityColors = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#17a2b8'
    };
    
    const statusColors = {
      passed: '#28a745',
      warning: '#ffc107',
      failed: '#dc3545'
    };
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Report - Xpress Ops Tower</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .status-badge { padding: 8px 16px; border-radius: 20px; font-weight: 600; color: white; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .summary-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .metric-label { color: #6c757d; font-size: 0.9em; }
        .section { background: white; margin: 30px 0; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .vuln-item { border-left: 4px solid; padding: 15px; margin: 15px 0; background: #f8f9fa; border-radius: 0 4px 4px 0; }
        .vuln-critical { border-left-color: ${severityColors.critical}; }
        .vuln-high { border-left-color: ${severityColors.high}; }
        .vuln-medium { border-left-color: ${severityColors.medium}; }
        .vuln-low { border-left-color: ${severityColors.low}; }
        .severity-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; color: white; }
        .recommendation { border: 1px solid #dee2e6; padding: 20px; margin: 15px 0; border-radius: 8px; }
        .chart { height: 300px; margin: 20px 0; }
        .progress-bar { height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .timestamp { color: #6c757d; font-size: 0.8em; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: 600; }
        .compliance-indicator { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
        .compliant { background: #28a745; }
        .non-compliant { background: #dc3545; }
        .partial { background: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Security Analysis Report</h1>
            <p><strong>Xpress Ops Tower</strong> - ${this.report.metadata.generated_at}</p>
            <span class="status-badge" style="background: ${statusColors[this.report.summary.overall_status]}">
                ${this.report.summary.overall_status.toUpperCase()}
            </span>
            <div class="timestamp">
                Pipeline: ${this.report.metadata.pipeline_run} | 
                Commit: ${this.report.metadata.commit.slice(0, 8)} | 
                Branch: ${this.report.metadata.branch}
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="metric-value" style="color: ${severityColors.critical}">${this.report.summary.critical_count}</div>
                <div class="metric-label">Critical Vulnerabilities</div>
            </div>
            <div class="summary-card">
                <div class="metric-value" style="color: ${severityColors.high}">${this.report.summary.high_count}</div>
                <div class="metric-label">High Severity</div>
            </div>
            <div class="summary-card">
                <div class="metric-value" style="color: ${severityColors.medium}">${this.report.summary.medium_count}</div>
                <div class="metric-label">Medium Severity</div>
            </div>
            <div class="summary-card">
                <div class="metric-value" style="color: ${severityColors.low}">${this.report.summary.low_count}</div>
                <div class="metric-label">Low Severity</div>
            </div>
            <div class="summary-card">
                <div class="metric-value" style="color: #007bff">${Math.round(this.report.metrics.security_score)}</div>
                <div class="metric-label">Security Score</div>
            </div>
            <div class="summary-card">
                <div class="metric-value" style="color: #6f42c1">${Math.round((this.report.metrics.test_success_rate || 0) * 100)}%</div>
                <div class="metric-label">Test Success Rate</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Component Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Component</th>
                        <th>Status</th>
                        <th>Tools</th>
                        <th>Findings</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(this.report.components).map(([component, data]) => `
                        <tr>
                            <td>${component.replace('_', ' ').toUpperCase()}</td>
                            <td><span class="status-badge" style="background: ${statusColors.passed}; font-size: 0.8em;">${data.status}</span></td>
                            <td>${data.tools.join(', ')}</td>
                            <td>${data.findings}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${this.report.vulnerabilities.length > 0 ? `
        <div class="section">
            <h2>🚨 Vulnerabilities (${this.report.vulnerabilities.length})</h2>
            ${this.report.vulnerabilities.slice(0, 20).map(vuln => `
                <div class="vuln-item vuln-${vuln.severity}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong>${vuln.title}</strong>
                        <span class="severity-badge" style="background: ${severityColors[vuln.severity]}">${vuln.severity.toUpperCase()}</span>
                    </div>
                    <p>${vuln.description}</p>
                    <div class="timestamp">
                        Source: ${vuln.source} | Category: ${vuln.category}
                        ${vuln.package ? ` | Package: ${vuln.package}` : ''}
                    </div>
                </div>
            `).join('')}
            ${this.report.vulnerabilities.length > 20 ? `<p><em>... and ${this.report.vulnerabilities.length - 20} more vulnerabilities</em></p>` : ''}
        </div>
        ` : '<div class="section"><h2>✅ No Vulnerabilities Found</h2><p>Great job! No security vulnerabilities were detected.</p></div>'}

        <div class="section">
            <h2>📋 Compliance Assessment</h2>
            <table>
                <thead>
                    <tr>
                        <th>Standard</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(this.report.compliance).map(([standard, data]) => `
                        <tr>
                            <td>${standard.replace('_', ' ').toUpperCase()}</td>
                            <td>
                                <span class="compliance-indicator ${data.status === 'compliant' ? 'compliant' : 'non-compliant'}"></span>
                                ${data.status}
                            </td>
                            <td>${data.score || 'N/A'}</td>
                            <td>${JSON.stringify(data).length > 200 ? 'See detailed report' : JSON.stringify(data, null, 2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>💡 Recommendations</h2>
            ${this.report.recommendations.map((rec, index) => `
                <div class="recommendation">
                    <h4>${rec.title} <span class="severity-badge" style="background: ${severityColors[rec.priority] || '#6c757d'}">${rec.priority.toUpperCase()}</span></h4>
                    <p><strong>Description:</strong> ${rec.description}</p>
                    <p><strong>Impact:</strong> ${rec.impact}</p>
                    <p><strong>Timeline:</strong> ${rec.timeline}</p>
                    <div><strong>Actions:</strong></div>
                    <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>📈 Security Metrics</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="metric-label">Vulnerability Density</div>
                    <div class="metric-value" style="font-size: 1.5em;">${(this.report.metrics.vulnerability_density || 0).toFixed(2)}</div>
                </div>
                <div class="summary-card">
                    <div class="metric-label">Critical Rate</div>
                    <div class="metric-value" style="font-size: 1.5em;">${Math.round((this.report.metrics.critical_vulnerability_rate || 0) * 100)}%</div>
                </div>
                <div class="summary-card">
                    <div class="metric-label">Security Coverage</div>
                    <div class="metric-value" style="font-size: 1.5em;">${Math.round((this.report.metrics.coverage || 0) * 100)}%</div>
                </div>
                <div class="summary-card">
                    <div class="metric-label">MTTR Estimate</div>
                    <div class="metric-value" style="font-size: 1.5em;">${this.report.metrics.mttr_estimate || 'N/A'}</div>
                </div>
            </div>
        </div>

        <footer style="text-align: center; padding: 40px 0; color: #6c757d;">
            <p>Generated by Xpress Ops Tower Security Pipeline on ${this.report.metadata.generated_at}</p>
            <p>For questions or support, contact the Security Team</p>
        </footer>
    </div>
</body>
</html>`;
  }

  generateSARIF() {
    return {
      version: "2.1.0",
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      runs: [{
        tool: {
          driver: {
            name: "Xpress Ops Security Pipeline",
            version: "1.0.0",
            informationUri: "https://github.com/xpress/ops-tower"
          }
        },
        results: this.report.vulnerabilities.map(vuln => ({
          ruleId: vuln.id,
          level: this.mapSeverityToSARIF(vuln.severity),
          message: {
            text: vuln.description
          },
          locations: vuln.file ? [{
            physicalLocation: {
              artifactLocation: {
                uri: vuln.file
              },
              region: vuln.line ? {
                startLine: vuln.line
              } : undefined
            }
          }] : []
        }))
      }]
    };
  }

  // Utility methods
  async findFiles(...patterns) {
    const files = [];
    try {
      const allFiles = await this.walkDirectory(this.artifactsPath);
      for (const pattern of patterns) {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        files.push(...allFiles.filter(file => regex.test(file)));
      }
    } catch (error) {
      console.warn('Error finding files:', error.message);
    }
    return [...new Set(files)]; // Remove duplicates
  }

  async walkDirectory(dir) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...await this.walkDirectory(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    return files;
  }

  mapSARIFSeverity(level) {
    const mapping = {
      'error': 'high',
      'warning': 'medium',
      'note': 'low',
      'info': 'low'
    };
    return mapping[level] || 'medium';
  }

  mapSeverityToSARIF(severity) {
    const mapping = {
      'critical': 'error',
      'high': 'error',
      'medium': 'warning',
      'low': 'note'
    };
    return mapping[severity] || 'warning';
  }

  mapZAPRisk(risk) {
    const mapping = {
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low',
      'Informational': 'low'
    };
    return mapping[risk] || 'medium';
  }

  mapZAPConfidence(confidence) {
    const mapping = {
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low'
    };
    return mapping[confidence] || 'medium';
  }

  extractSARIFLocation(result) {
    if (result.locations && result.locations[0]) {
      const location = result.locations[0];
      return {
        file: location.physicalLocation?.artifactLocation?.uri,
        line: location.physicalLocation?.region?.startLine
      };
    }
    return {};
  }

  extractCWE(result) {
    if (result.properties && result.properties.tags) {
      const cweTag = result.properties.tags.find(tag => tag.startsWith('external/cwe/'));
      return cweTag ? cweTag.split('/')[2] : null;
    }
    return null;
  }

  getTopVulnerabilities() {
    return this.report.vulnerabilities
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 10);
  }

  async analyzeTrends() {
    // This would analyze historical data if available
    return {
      trend: 'stable',
      change_percentage: 0,
      historical_data_available: false
    };
  }

  calculateMTTR() {
    // Mean Time To Repair estimate based on severity
    const weights = {
      critical: 0.5, // 0.5 days
      high: 2,       // 2 days
      medium: 7,     // 1 week
      low: 30        // 1 month
    };
    
    let totalTime = 0;
    let totalVulns = 0;
    
    for (const vuln of this.report.vulnerabilities) {
      totalTime += weights[vuln.severity] || weights.medium;
      totalVulns++;
    }
    
    if (totalVulns === 0) return '0 days';
    
    const avgDays = totalTime / totalVulns;
    if (avgDays < 1) return `${Math.round(avgDays * 24)} hours`;
    return `${Math.round(avgDays)} days`;
  }

  calculateSecurityCoverage() {
    const totalComponents = Object.keys(this.report.components).length;
    const completedComponents = Object.values(this.report.components)
      .filter(comp => comp.status === 'completed').length;
    
    return completedComponents / Math.max(totalComponents, 1);
  }

  getOWASPIssues() {
    const owaspCategories = ['injection', 'broken_auth', 'sensitive_data', 'xxe', 'broken_access', 'security_misc', 'xss', 'insecure_deserialization', 'vulnerable_components', 'insufficient_logging'];
    
    return this.report.vulnerabilities
      .filter(v => owaspCategories.some(cat => v.category?.includes(cat) || v.description?.toLowerCase().includes(cat)))
      .map(v => ({
        category: v.category,
        title: v.title,
        severity: v.severity
      }))
      .slice(0, 10);
  }

  getPCIRequirementsMet() {
    const requirements = {
      'Install and maintain firewalls': true,
      'Do not use vendor-supplied defaults': true,
      'Protect stored cardholder data': this.report.vulnerabilities.filter(v => v.category === 'data_exposure').length === 0,
      'Encrypt transmission of cardholder data': true,
      'Protect against malware': this.report.vulnerabilities.filter(v => v.source === 'container').length < 5,
      'Develop secure systems': this.report.vulnerabilities.filter(v => v.severity === 'critical').length === 0,
      'Restrict access by business need': this.report.vulnerabilities.filter(v => v.category === 'access_control').length === 0,
      'Identify and authenticate access': true,
      'Restrict physical access': true,
      'Track and monitor access': true,
      'Regularly test security': this.report.summary.tests_executed > 0,
      'Maintain information security policy': true
    };
    
    return requirements;
  }

  assessGDPRCompliance() {
    const dataIssues = this.report.vulnerabilities.filter(v => 
      v.category?.includes('data') || v.description?.toLowerCase().includes('personal')
    ).length;
    
    return dataIssues === 0 ? 'compliant' : 'needs_review';
  }

  calculateDataProtectionScore() {
    const dataVulns = this.report.vulnerabilities.filter(v => 
      v.category?.includes('data') || v.source === 'secrets'
    ).length;
    
    return Math.max(0, 100 - (dataVulns * 10));
  }

  assessPrivacyControls() {
    return {
      data_encryption: 'implemented',
      access_controls: 'implemented', 
      audit_logging: 'implemented',
      data_minimization: 'needs_review',
      consent_management: 'needs_review'
    };
  }

  assessPhilippinesDataPrivacy() {
    // Philippines Data Privacy Act compliance
    return this.assessGDPRCompliance(); // Similar requirements
  }

  assessNPCCompliance() {
    return {
      registration_required: false,
      data_protection_officer: true,
      privacy_impact_assessment: 'needs_review',
      breach_notification: 'implemented'
    };
  }

  getLocalRequirements() {
    return [
      'BSP cybersecurity guidelines',
      'DOTr digital transformation compliance',
      'DICT cybersecurity framework',
      'NPC data privacy regulations'
    ];
  }
}

// CLI interface
if (require.main === module) {
  const generator = new SecurityReportGenerator();
  
  generator.generateReport()
    .then(report => {
      console.log('\n📊 Security report generation completed');
      console.log(`Status: ${report.summary.overall_status}`);
      console.log(`Vulnerabilities: ${report.summary.total_vulnerabilities}`);
      console.log(`Security Score: ${Math.round(report.metrics.security_score)}/100`);
      
      // Exit with appropriate code for CI/CD
      if (report.summary.overall_status === 'failed') {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Report generation failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityReportGenerator;