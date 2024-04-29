//TODO needs to be polished up to be consistent with the action one we provide the necessary inputs and controls on that

import ReportGenerator, { ReportGeneratorConfig } from '../ReportGenerator';
import { Octokit } from '@octokit/rest';

import path from 'path';
import { ConsoleLogger } from '../logging/ConsoleLogger';

const {program} = require('commander');
program.name('github-security-report');
program.version(require('../package.json').version);

program.requiredOption('-t, --token <token>', 'github access token');
program.requiredOption('-r --repository <repository>', 'github repository, owner/repo_name format');
program.option('-o --output-directory <outputDirectory>', 'output directory for summary report', '.');
program.option('--github-api-url <url>', 'GitHub API URL', 'https://api.github.com')

program.parse(process.argv);
const opts = program.opts();

const reportGenerateConfig: ReportGeneratorConfig = {
  repository: opts.repository,
  ref: 'main', //TODO need to turn in to parameter and add sarif id
  octokit: new Octokit({auth: opts.token, baseUrl: opts.url}),
  outputDirectory: getPath(opts.outputDirectory),
  templating: {
    name: 'summary'
  },
  include: {
    codeScanning: true,
    secretScanning: true,
    softwareCompositionAnalysis: true
  },
  logger: new ConsoleLogger()
}

async function execute(reportGenerateConfig: ReportGeneratorConfig) {
  try {
    const generator = new ReportGenerator(reportGenerateConfig);
    console.log(`Generating Security report for ${reportGenerateConfig.repository}...`);
    const file = await generator.run();
    console.log(`Summary Report generated: ${file}`);

  } catch (err: any) {
    console.log(err.stack);
    console.error(err.message);
    console.error();
    program.help({error: true});
  }
}

execute(reportGenerateConfig);


function getPath(value) {
  if (path.isAbsolute(value)) {
    return value;
  } else {
    return path.normalize(path.join(process.cwd(), value));
  }
}