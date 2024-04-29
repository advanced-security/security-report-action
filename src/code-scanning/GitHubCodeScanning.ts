import { Octokit } from '@octokit/rest';
import { Endpoints } from '@octokit/types';

import CodeScanningAlert, { CodeScanningData } from './CodeScanningAlert';
import CodeScanningResults from './CodeScanningResults';
import { Repo } from '../github';
import { SarifData } from './SarifData';
import { Logger } from '../logging/Logger';

type ListCodeScanningAnalysesResponse = Endpoints['GET /repos/{owner}/{repo}/code-scanning/analyses']['response'];
type ListCodeScanningAlertsParameters = Endpoints['GET /repos/{owner}/{repo}/code-scanning/alerts']['parameters'];

const TOOL_NAME_CODEQL = 'CodeQL';
const DEFAULT_MAIN_BRANCH = 'refs/heads/main';

export type CodeScanningAnalysisResultArray = ListCodeScanningAnalysesResponse['data'];
export type CodeScanningAnalysisResult = CodeScanningAnalysisResultArray[0];

export type CodeScanningAnalysisWithAge = {
  ageInSeconds: number,
  scan: CodeScanningAnalysisResult
}

export type CodeScanningAnalysisWithSarifData = CodeScanningAnalysisWithAge & {
  sarif: SarifData
}

export type CodeScanningAnalysisFilter = {
  toolName?: string,
  category?: string,
  ref?: string,
  sarifId?: string
}

export type CodeScanningDelta = {
  head: CodeScanningAnalysisFilter,
  base: CodeScanningAnalysisFilter
}

export type CodeScanningAnalysisComparison = {
  repo: Repo,
  head: CodeScanningAnalysisWithSarifData,
  base: CodeScanningAnalysisWithSarifData
}

export default class GitHubCodeScanning {

  private readonly octokit: Octokit;

  private readonly logger: Logger;

  constructor(octokit, logger: Logger) {
    this.octokit = octokit;
    this.logger = logger;
  }

  getOpenCodeScanningAlerts(repo: Repo): Promise<CodeScanningResults> {
    return getCodeScanningAlerts(this.octokit, repo, 'open');
  }

  getClosedCodeScanningAlerts(repo: Repo): Promise<CodeScanningResults> {
    return getCodeScanningAlerts(this.octokit, repo, 'dismissed');
  }

  getAnalyses(repo: Repo, filter?: CodeScanningAnalysisFilter): Promise<CodeScanningAnalysisResultArray> {
    return getCodeScanningAnalyses(this.octokit, repo, filter);
  }

  getLatestAnalysis(repo: Repo, filter?: CodeScanningAnalysisFilter): Promise<CodeScanningAnalysisWithAge | undefined> {
    // This uses the default sorting to pick the latest analysis
    return getCodeScanningAnalyses(this.octokit, repo, filter)
      .then(createLatestAnalysisData);
  }

  getLatestAnalysisWithSarifData(repo: Repo, filter?: CodeScanningAnalysisFilter): Promise<CodeScanningAnalysisWithSarifData | undefined> {
    return this.getLatestAnalysis(repo, filter)
      .then((data: any) => {
        if (data?.scan) {
          return getCodeScanningAnalysis(this.octokit, repo, data.scan.id, true)
            .then(sarif => {
              return {
                ...data,
                sarif: sarif
              }
            });
        }
        return undefined;
      });
  }

  getCodeScanningAnalysis(repo: Repo, id: number) {
    return getCodeScanningAnalysis(this.octokit, repo, id, false);
  }

  getCodeScanningAnalysisSarif(repo: Repo, id: number) {
    return getCodeScanningAnalysis(this.octokit, repo, id, true);
  }

  compareAnalyses(repo: Repo, sourceAnalysisId: number, targetAnalysisId: number): Promise<CodeScanningAnalysisComparison> {
    //@ts-ignore
    return Promise.all([
      this.getCodeScanningAnalysis(repo, sourceAnalysisId),
      this.getCodeScanningAnalysisSarif(repo, sourceAnalysisId),
      this.getCodeScanningAnalysis(repo, targetAnalysisId),
      this.getCodeScanningAnalysisSarif(repo, targetAnalysisId)
    ])
      .then((results: any[]) => {
        if (results[0] === undefined) {
          throw new Error(`Failure to resolve a source analysis for ${sourceAnalysisId} on ${repo.owner}/${repo.repo}`);
        } else if (results[2] === undefined) {
          throw new Error(`Failure to resolve a target analysis for ${targetAnalysisId} on ${repo.owner}/${repo.repo}`);
        }
        return {
          repo: repo,
          head: {
            ...createLatestAnalysisData([results[0]]),
            sarif: results[1]
          },
          base: {
            ...createLatestAnalysisData([results[2]]),
            sarif: results[3]
          }
        }
      });
  }

  compareLatestAnalyses(repo: Repo, filter: CodeScanningAnalysisFilter): Promise<CodeScanningAnalysisComparison> {
    return getCodeScanningAnalyses(this.octokit, repo, filter)
      .then((results?: CodeScanningAnalysisResultArray) => {
        if (results && results.length > 1) {
          return this.compareAnalyses(repo, results[0].id, results[1].id);
        }
        throw new Error(`Failed to find two analyses to compare for ${repo.owner}/${repo.repo} using filter ${JSON.stringify(filter)}`);
      });
  }
}


function createLatestAnalysisData(data?: CodeScanningAnalysisResultArray): CodeScanningAnalysisWithAge | undefined {
  if (data) {
    const latest = data.length > 0 ? data[0] : undefined;
    const created = latest ? latest.created_at : undefined;

    if (latest && created) {
      const ageInMs = Date.now() - Date.parse(created);
      const ageInSeconds = Math.floor(ageInMs / 1000 / 60);
      return {
        ageInSeconds: ageInSeconds,
        //@ts-ignore
        scan: latest
      }
    }
  }

  return undefined;
}

function getCodeScanningAnalysis(octokit: Octokit, repo: Repo, id: number, sarifData: boolean = false): Promise<CodeScanningAnalysisResult | undefined> {
  //   console.log(`Fetching analysis ${id} on repo ${repo.owner}/${repo.repo}`);
  const params = {
    ...repo,
    analysis_id: id,
  }

  if (sarifData) {
    params['headers'] = {
      accept: 'application/sarif+json'
    }
  }

  return octokit.rest.codeScanning.getAnalysis(params)
    .catch((error: any) => {
      if (error.status === 404) {
        return undefined;
      }
      throw error;
    })
    .then((results: any) => {
      if (results) {
        return results.data;
      }
      return undefined;
    });
}

function getCodeScanningAlerts(octokit: Octokit, repo: Repo, state: 'open' | 'fixed' | 'dismissed'): Promise<CodeScanningResults> {
  const params: ListCodeScanningAlertsParameters = {
    ...repo,
    state: state
  };

  return octokit.paginate('GET /repos/:owner/:repo/code-scanning/alerts', params)
    //@ts-ignore
    .then((alerts: CodeScanningListAlertsForRepoResponseData) => {
      const results: CodeScanningResults = new CodeScanningResults();

      alerts.forEach((alert: CodeScanningData) => {
        results.addCodeScanningAlert(new CodeScanningAlert(alert));
      });

      return results;
    });
}

function getCodeScanningAnalyses(octokit: Octokit, repo: Repo, filter?: CodeScanningAnalysisFilter): Promise<CodeScanningAnalysisResultArray> {
  // When 404 should check if the repo exists and error appropriately rather than return undefined?

  const params = {
    ...repo,
    per_page: 100,
  };

  // A filter is optional, if none of these are specified then we get all analyses
  if (filter) {
    if (filter.toolName) {
      params['tool_name'] = filter.toolName;
    }

    if (filter.ref) {
      params['ref'] = filter.ref;
    }

    if (filter.sarifId) {
      params['sarif_id'] = filter.sarifId;
    }
  }

  return octokit.paginate('GET /repos/:owner/:repo/code-scanning/analyses', params)
    .catch((error: any) => {
      if (error.status === 404) {
        return undefined;
      }
      throw error;
    })
    .then((results: any) => {
      if (!results) {
        return [];
      }
      return results;
    })
    .then((results: any) => {
      if (filter?.category) {
        return results.filter((analysis: any) => { return analysis.category === filter.category });
      }
      return results;
    });
}
