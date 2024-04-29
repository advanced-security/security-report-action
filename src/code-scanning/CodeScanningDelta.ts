import { CodeScanningAnalysisComparison } from "./GitHubCodeScanning";
import { SarifResult, SarifRule } from "./SarifData";

export class CodeScanningDelta {

  private data: CodeScanningAnalysisComparison;

  constructor(data: CodeScanningAnalysisComparison) {
    this.data = data;
  }

  get repo() {
    return this.data.repo;
  }

  getDeltaSummary() {
    const head = this.data.head;
    const headSarif = head?.sarif?.runs?.[0];
    const headRules = getRules(headSarif?.tool);
    const headArtifacts = getArtifacts(headSarif);

    const base = this.data.base;
    const baseSarif = base?.sarif?.runs?.[0];
    const baseRules = getRules(baseSarif?.tool);
    const baseArtifacts = getArtifacts(baseSarif);

    return {
      head: {
        id: head.scan.id,
        sarifId: head.scan.sarif_id,
      },

      base: {
        id: base.scan.id,
        sarifId: base.scan.sarif_id,
      },

      rules: {
        delta: compareRules(headRules, baseRules),

        head: {
          count: headRules.length,
          rules: headRules
        },
        base: {
          count: baseRules.length,
          rules: baseRules
        }
      },

      artifacts: {
        delta: compareArtifacts(headArtifacts, baseArtifacts),

        head: {
          count: headArtifacts.length,
          artifacts: headArtifacts
        },
        base: {
          count: baseArtifacts.length,
          artifacts: baseArtifacts
        }
      },

      results: {
        delta: compareResults(headSarif.results, baseSarif.results),
        head: {
          count: headSarif.results.length,
          results: headSarif.results
        },
        base: {
          count: baseSarif.results.length,
          results: baseSarif.results
        }
      }
    }
  }
}

type Artifact = {
  location: {
    index: number
    uri: string
  }
}

type Delta = {
  added: string[]
  removed: string[],
  existing: string[]
}

type ResultsDelta = {
  added: SarifRule[]
  removed: SarifRule[],
  existing: SarifRule[]
}

function compareResults(head: SarifResult[], base: SarifResult[]): ResultsDelta {
  const headResultsMap = new Map<string, SarifResult>();
  head.forEach(headResult => {
    headResultsMap.set(headResult.correlationGuid, headResult);
  });

  const baseResultsMap = new Map<string, SarifResult>();
  base.forEach(baseResult => {
    baseResultsMap.set(baseResult.correlationGuid, baseResult);
  });

  const results: ResultsDelta = {
    added:[],
    removed: [],
    existing: []
  };

  for(let headCorrelationId of headResultsMap.keys()) {
    const headResult = headResultsMap.get(headCorrelationId);

    if (baseResultsMap.has(headCorrelationId)) {
      //@ts-ignore
      results.existing.push(headResult);
    } else {
      //@ts-ignore
      results.added.push(headResult);
    }
  }

  for (let baseCorrelationId of baseResultsMap.keys()) {
    const baseResult = baseResultsMap.get(baseCorrelationId);

    if (!headResultsMap.has(baseCorrelationId)) {
      //@ts-ignore
      results.removed.push(baseResult);
    }
  }

  return results;
}

function compareRules(head: SarifRule[], base: SarifRule[]) {
  const headRules = head.map(headRule => headRule.id);
  const baseRules = base.map(baseRule => baseRule.id);

  const results: Delta = {
    added:[],
    removed: [],
    existing: []
  };

  headRules.forEach(headRule => {
    if (baseRules.includes(headRule)) {
      results.existing.push(headRule);
    } else {
      results.added.push(headRule);
    }
  });

  baseRules.forEach(baseRule => {
    if (!headRules.includes(baseRule)) {
      results.removed.push(baseRule);
    }
  });

  return results;
}

function compareArtifacts(head: Artifact[], base: Artifact[]) {
  const results: Delta = {
    added:[],
    removed: [],
    existing: []
  };

  const headFiles: string[] = head.map(headArtifact => headArtifact.location.uri);
  const baseFiles: string[] = base.map(baseArtifact => baseArtifact.location.uri);

  headFiles.forEach(headFile => {
    if (baseFiles.includes(headFile)) {
      results.existing.push(headFile);
    } else {
      results.added.push(headFile);
    }
  });

  baseFiles.forEach(baseFile => {
    if (!headFiles.includes(baseFile)) {
      results.removed.push(baseFile);
    }
  });

  results.existing = headFiles;
  return results;
}

function getArtifacts(sarifRun: any): any[] {
  const artifacts: any[] = [];

  if (sarifRun?.artifacts) {
    sarifRun.artifacts.forEach(artifact => {
      artifacts.push(artifact);
    });
  }
  return artifacts;
}

function getRules(tool: any): any[] {
  const rules: any[] = [];

  if (tool?.extensions) {
    tool.extensions.forEach(extension => {
      if (extension?.rules) {
        extension.rules.forEach(rule => {
          rules.push(rule);
        });
      }
    });
  }

  return rules;
}
