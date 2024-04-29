import { Octokit } from "@octokit/rest";
import ReportData from './templating/ReportData';
import { CollectedData } from './templating/ReportTypes';
import { Repo } from "./github";
import CodeScanningResults from "./code-scanning/CodeScanningResults";
import { Logger } from "./logging/Logger";
import { CodeScanningDataCollector } from "./code-scanning/CodeScanningDataCollector";
import { SoftwareCompositionDataCollector } from "./dependencies/SoftwareCompositionAnalysisCollector";

export type DataCollectionOptions = {
  codeScanning: boolean;
  secretScanning: boolean;
  softwareCompositionAnalysis: boolean;
}

export default class DataCollector {

  readonly repo: Repo;

  readonly ref: string;

  readonly sarifId?: string;

  private readonly octokit: Octokit;

  private readonly logger : Logger;

  constructor(octokit: Octokit, logger: Logger, repo: string, ref: string, sarifId?: string) {
    if (!octokit) {
      throw new Error('A GitHub Octokit client needs to be provided');
    }
    this.octokit = octokit;

    this.logger = logger;

    if (!repo) {
      throw new Error('A GitHub repository must be provided');
    }
    const parts = repo.split('/')
    this.repo = {
      owner: parts[0],
      repo: parts[1]
    }

    if (!ref) {
      throw new Error(`A repository ref must be provided`);
    }
    this.ref = ref;

    this.sarifId = sarifId;
  }

  getPayload(config?: DataCollectionOptions): Promise<ReportData> {
    const collectionOptions = config || {
      codeScanning: true,
      secretScanning: true,
      softwareCompositionAnalysis: true,
    };

    return this.octokit.repos.get({
      ...this.repo
    }).catch(err => {
      if (err.status === 404) {
        throw new Error(`Not Found, failed to fetch repository information for ${this.repo.owner}/${this.repo.repo}, check that the repository exists and that the provided token has access to it.`);
      } else {
        throw err;
      }
    }).then(repoResult => {
      //TODO could return the repo data in the payload if considered useful, we have already looked it up
      const promises: Promise<any>[] = [];

      if (collectionOptions.codeScanning) {
        const codeScanningCollector = new CodeScanningDataCollector(this.logger, this.octokit);
        promises.push(codeScanningCollector.fetchData(this.repo, this.sarifId));
      } else {
        promises.push(Promise.resolve({
          codeScanning: undefined,
          open: new CodeScanningResults(),
          closed: new CodeScanningResults(),
        }));
      }

      if (collectionOptions.softwareCompositionAnalysis) {
        const softwareCompositionCollector = new SoftwareCompositionDataCollector(this.logger, this.octokit);
        promises.push(softwareCompositionCollector.fetchData(this.repo));
      } else {
        promises.push(Promise.resolve({
          dependencies: [],
          vulnerabilities: [],
        }));
      }

      return Promise.all(promises).then(results => {
        const codeScanningResults = results[0];
        const scaResults = results[1];

        const data: CollectedData = {
          github: this.repo,
          dependencies: scaResults.dependencies,
          vulnerabilities: scaResults.vulnerabilities,
          codeScanning: codeScanningResults.codeScanning,
          codeScanningOpen: codeScanningResults.open,
          codeScanningClosed: codeScanningResults.closed,
        };
        return new ReportData(data);
      });
    })
  }
}
