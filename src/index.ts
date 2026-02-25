import ReportGenerator from './ReportGenerator';

import * as core from '@actions/core';
import { getApiBaseUrl, getOctokit } from './github';
import { ActionsLogger } from './logging/ActionsLogger';

async function run(): Promise<void> {
  try {
    const token = getRequiredInputValue('token');
    const baseUrl = getApiBaseUrl();
    const logger = new ActionsLogger();

    core.debug(`Building octokit client for base URL: ${baseUrl}`);
    const octokit = getOctokit(token, baseUrl, logger);

    const reportGeneratorInputs = {
      repository: getRequiredInputValue('repository'),
      ref: getRequiredInputValue('ref'),
      sarifId: core.getInput('sarif_report_id'),
      octokit: octokit,
      outputDirectory: getRequiredInputValue('outputDir'),
      templating: {
        name: core.getInput('report_template') || 'summary'
      },
      include: {
        codeScanning: core.getBooleanInput('include_code_scanning'),
        secretScanning: core.getBooleanInput('include_secret_scanning'),
        softwareCompositionAnalysis: core.getBooleanInput('include_software_composition_analysis'),
      },
      logger: logger,
    }

    const generator = new ReportGenerator(reportGeneratorInputs);

    const file = await generator.run();
    console.log(file);
  } catch (err: any) {
    core.error(err.stack);
    core.setFailed(err.message);
  }
}

run();

function getRequiredInputValue(key: string): string {
  return core.getInput(key, {required: true});
}