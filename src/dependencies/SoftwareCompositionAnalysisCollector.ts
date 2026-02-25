import { Octokit } from "@octokit/rest";
import { Logger } from "../logging/Logger";
import GitHubDependencies from "./GitHubDependencies";
import { Repo } from "../github";
import DependencySet from "./DependencySet";
import Vulnerability from "./Vulnerability";


export type SoftwareCompositionCollectorResult = {
  dependencies: DependencySet[];
  vulnerabilities: Vulnerability[];
}

export class SoftwareCompositionDataCollector {

  private readonly logger: Logger;

  private readonly octokit: Octokit;

  constructor(logger: Logger, octokit: Octokit) {
    this.logger = logger;
    this.octokit = octokit;
  }

  fetchData(repo: Repo): Promise<SoftwareCompositionCollectorResult> {
    return this._collectSoftwareCompositionAnalysisData(repo);
  }

  private _collectSoftwareCompositionAnalysisData(repo: Repo): Promise<SoftwareCompositionCollectorResult> {
    const ghDeps = new GitHubDependencies(this.octokit, this.logger);

    return Promise.all([
      ghDeps.getAllDependencies(repo),
      ghDeps.getAllVulnerabilities(repo),
    ]).then(results => {
      return {
        dependencies: results[0],
        vulnerabilities: results[1],
      };
    });
  }
}
