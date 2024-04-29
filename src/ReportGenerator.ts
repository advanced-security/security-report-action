import { Octokit } from '@octokit/rest';
import DataCollector, { DataCollectionOptions } from './DataCollector';
import Template from './templating/Template';
import { createPDF } from './pdf/pdfWriter';
import * as path from 'path';

import { mkdirP } from '@actions/io';
import { Logger } from './logging/Logger';

export type ReportGeneratorConfig = {
  repository: string,
  ref: string,

  sarifId?: string,

  octokit: Octokit,

  outputDirectory: string,

  templating: {
    directory?: string,
    name: string,
  },

  include: DataCollectionOptions,

  logger: Logger
}

export default class ReportGenerator {

  private readonly config: ReportGeneratorConfig;

  constructor(config: ReportGeneratorConfig) {
    this.config = config;
  }

  run(): Promise<string> {
    const config = this.config;
    const collector = new DataCollector(config.octokit, config.logger, config.repository, config.ref, config.sarifId);

    return collector.getPayload()
      .then(reportData => {
        const reportTemplate = new Template(config.templating.directory);
        return reportTemplate.render(reportData.getJSONPayload(), config.templating.name);
      })
      .then(html => {
        return mkdirP(config.outputDirectory)
          .then(() => {
            return createPDF(html, path.join(config.outputDirectory, 'summary.pdf'));
          });
      })
      .catch(err => {
        this.config.logger.error(err.message);
        throw err;
      });
  }
}