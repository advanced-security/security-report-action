import { Octokit } from "@octokit/rest";
import { Logger } from "../logging/Logger";
import { Repo } from "../github";
import GitHubCodeScanning, { CodeScanningAnalysisWithSarifData } from "./GitHubCodeScanning";
import CodeScanningResults from "./CodeScanningResults";


export type CodeScanningCollectorResult = {
  codeScanning?: CodeScanningAnalysisWithSarifData;
  open: CodeScanningResults;
  closed: CodeScanningResults;
}

export class CodeScanningDataCollector {

  private readonly logger: Logger;

  private readonly octokit: Octokit;

  constructor(logger: Logger, octokit: Octokit) {
    this.logger = logger;
    this.octokit = octokit;
  }

  fetchData(repo: Repo, sarifId?: string): Promise<CodeScanningCollectorResult> {
    return this._collectCodeScanningData(repo, sarifId);
  }

  private _collectCodeScanningData(repo: Repo, sarifId?: string): Promise<CodeScanningCollectorResult> {
    const codeScanning = new GitHubCodeScanning(this.octokit, this.logger);

    return Promise.all([
      codeScanning.getLatestAnalysisWithSarifData(repo, { sarifId, toolName: 'CodeQL' }),
      codeScanning.getOpenCodeScanningAlerts(repo),
      codeScanning.getClosedCodeScanningAlerts(repo),
    ]).then(results => {
      return {
        codeScanning: results[0],
        open: results[1] || new CodeScanningResults(),
        closed: results[2] || new CodeScanningResults(),
      };
    });
  }
}