#!/usr/bin/env node

const yargs = require('yargs');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const TRANSFORMS_DIR = path.join(__dirname, '../transforms');
const DEFAULT_EXTENSIONS = 'tsx,ts,jsx,js';

const transforms = {
  'migrate-components': {
    description: 'Migrate legacy components to new XP UI components',
    file: 'migrate-components.js',
  },
  'migrate-colors': {
    description: 'Replace hardcoded colors with CSS variables',
    file: 'migrate-colors.js',
  },
  'add-theme-provider': {
    description: 'Wrap app with XpThemeProvider',
    file: 'add-theme-provider.js',
  },
};

function runTransform(transformName, paths, options = {}) {
  const transform = transforms[transformName];
  if (!transform) {
    console.error(chalk.red(`Transform "${transformName}" not found`));
    process.exit(1);
  }

  const transformPath = path.join(TRANSFORMS_DIR, transform.file);
  if (!fs.existsSync(transformPath)) {
    console.error(chalk.red(`Transform file not found: ${transformPath}`));
    process.exit(1);
  }

  console.log(chalk.blue(`Running transform: ${transformName}`));
  console.log(chalk.gray(`Description: ${transform.description}`));

  const jscodeshiftCmd = [
    'npx jscodeshift',
    `--transform=${transformPath}`,
    `--extensions=${options.extensions || DEFAULT_EXTENSIONS}`,
    options.dry ? '--dry' : '',
    options.verbose ? '--verbose=2' : '',
    ...paths,
  ].filter(Boolean).join(' ');

  try {
    console.log(chalk.gray(`Command: ${jscodeshiftCmd}`));
    execSync(jscodeshiftCmd, { stdio: 'inherit' });
    console.log(chalk.green(`✅ Transform "${transformName}" completed successfully`));
  } catch (error) {
    console.error(chalk.red(`❌ Transform "${transformName}" failed`));
    process.exit(1);
  }
}

function generateReport(paths, options = {}) {
  console.log(chalk.blue('Generating migration report...'));
  
  const reportData = {
    timestamp: new Date().toISOString(),
    paths: paths,
    analysis: {
      legacyComponents: [],
      hardcodedColors: [],
      missingThemeProvider: false,
    },
    recommendations: [],
  };

  // Basic analysis - in a real implementation this would be more sophisticated
  paths.forEach(pattern => {
    const files = require('glob').sync(pattern);
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for legacy components
      if (content.includes('className=') && content.includes('bg-')) {
        reportData.analysis.legacyComponents.push({
          file,
          issues: ['Uses Tailwind classes that should be replaced with tokens'],
        });
      }
      
      // Check for hardcoded colors
      const colorMatches = content.match(/#[0-9a-fA-F]{3,8}/g) || [];
      if (colorMatches.length > 0) {
        reportData.analysis.hardcodedColors.push({
          file,
          colors: colorMatches,
        });
      }
      
      // Check for theme provider
      if (file.includes('app.') || file.includes('App.') || file.includes('_app.')) {
        if (!content.includes('XpThemeProvider')) {
          reportData.analysis.missingThemeProvider = true;
        }
      }
    });
  });

  // Generate recommendations
  if (reportData.analysis.legacyComponents.length > 0) {
    reportData.recommendations.push('Run "migrate-components" transform');
  }
  if (reportData.analysis.hardcodedColors.length > 0) {
    reportData.recommendations.push('Run "migrate-colors" transform');
  }
  if (reportData.analysis.missingThemeProvider) {
    reportData.recommendations.push('Run "add-theme-provider" transform');
  }

  const reportPath = 'xp-migration-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(chalk.green(`📄 Migration report saved to: ${reportPath}`));
  
  // Print summary
  console.log(chalk.blue('\n📊 Migration Summary:'));
  console.log(`Files with legacy components: ${reportData.analysis.legacyComponents.length}`);
  console.log(`Files with hardcoded colors: ${reportData.analysis.hardcodedColors.length}`);
  console.log(`Theme provider missing: ${reportData.analysis.missingThemeProvider ? 'Yes' : 'No'}`);
  
  if (reportData.recommendations.length > 0) {
    console.log(chalk.yellow('\n💡 Recommendations:'));
    reportData.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
}

yargs
  .scriptName('xp-ui-migrate')
  .usage('Usage: $0 <command> [options]')
  .command(
    'transform <name> <paths...>',
    'Run a specific transform',
    (yargs) => {
      return yargs
        .positional('name', {
          describe: 'Transform name',
          choices: Object.keys(transforms),
        })
        .positional('paths', {
          describe: 'File paths or glob patterns',
          type: 'array',
        })
        .option('dry', {
          alias: 'd',
          type: 'boolean',
          description: 'Dry run - show changes without applying them',
        })
        .option('verbose', {
          alias: 'v',
          type: 'boolean',
          description: 'Verbose output',
        })
        .option('extensions', {
          alias: 'e',
          type: 'string',
          description: 'File extensions to process',
          default: DEFAULT_EXTENSIONS,
        });
    },
    (argv) => {
      runTransform(argv.name, argv.paths, argv);
    }
  )
  .command(
    'report <paths...>',
    'Generate migration analysis report',
    (yargs) => {
      return yargs
        .positional('paths', {
          describe: 'File paths or glob patterns to analyze',
          type: 'array',
        });
    },
    (argv) => {
      generateReport(argv.paths);
    }
  )
  .command(
    'list',
    'List available transforms',
    {},
    () => {
      console.log(chalk.blue('Available transforms:'));
      Object.entries(transforms).forEach(([name, info]) => {
        console.log(`  ${chalk.green(name)}: ${info.description}`);
      });
    }
  )
  .demandCommand(1, 'You need at least one command')
  .help()
  .argv;