import { describe, expect, beforeEach, test, it} from 'vitest';

import GitHubCodeScanning from './GitHubCodeScanning';
import { getGitHubTestToken } from '../testUtils';
import { getApiBaseUrl, getOctokit } from '../github';
import { NullLogger } from '../logging/NullLogger';


describe('GitHubCodeScanning', () => {

  const REPO_TEST = {
    owner: 'octodemo-db',
    repo: 'demo-vulnerabilities-ghas'
  };

  const REPO_WEB_GOAT = {
    owner: 'octodemo-db',
    repo: 'forrester-webgoat'
  }
  const WEB_GOAT_REPO_SARIF_ID = '6be52990-612b-11ee-86ef-c079a9be65b6';

  const REPO_JAVA_SIMPLE_PROJECT = {
    owner: 'octodemo-db',
    repo: 'simple-java-project'
  };

  const CODE_SCANNING_CATEGORY_SONAR = 'sonar-like'

  let codeScanning: GitHubCodeScanning;

  beforeEach(() => {
    const octokit = getOctokit(getGitHubTestToken(), getApiBaseUrl(), new NullLogger());
    codeScanning = new GitHubCodeScanning(octokit, new NullLogger());
  });


  describe('#getLatestAnalysis()', () => {

    test('should get results with no filter', async () => {
      const repo = REPO_WEB_GOAT;

      const results = await codeScanning.getLatestAnalysis(repo);
      expect(results?.ageInSeconds).to.be.greaterThan(0);
      expect(results?.scan).to.not.be.undefined;
      expect(results?.scan.url).to.contain(repo.owner);
      expect(results?.scan.url).to.contain(repo.repo);
    });

    test('should get results with a SARIF id', async () => {
      const repo = REPO_WEB_GOAT;
      const latestAnalysis = await codeScanning.getLatestAnalysis(repo);

      if (!latestAnalysis) {
        throw new Error(`Failed to retrieve a valid code scanning analysis, check that code scanning anf GHAS is enable on tnhe repository ${repo.owner}/${repo.repo}`);
      }

      const analysis = await codeScanning.getLatestAnalysis(repo, {sarifId: latestAnalysis.scan.sarif_id});
      expect(analysis?.scan.sarif_id).to.equal(latestAnalysis.scan.sarif_id);
    });
  });


  describe('#getCodeScanningAnalysis()', () => {

    test('should get results', async () => {
      const repo = REPO_WEB_GOAT;
      const latestAnalysis = await codeScanning.getLatestAnalysis(repo);

      if (!latestAnalysis) {
        throw new Error(`Failed to retrieve a valid code scanning analysis, check that code scanning anf GHAS is enable on tnhe repository ${repo.owner}/${repo.repo}`);
      }

      const analysis = await codeScanning.getCodeScanningAnalysis(repo, latestAnalysis.scan.id);
      expect(analysis?.id).to.equal(latestAnalysis.scan.id);
    });
  });


  describe('#getCodeScanningAnalyses()', () => {

    it('should work with no filter', async () => {
      const results = await codeScanning.getAnalyses(REPO_JAVA_SIMPLE_PROJECT);
      expect(results).to.not.be.undefined;

      expect(results?.length).to.be.greaterThan(10);
    });

    it('should get results for an existing category', async () => {
      const results = await codeScanning.getAnalyses(REPO_JAVA_SIMPLE_PROJECT, {category: CODE_SCANNING_CATEGORY_SONAR});
      expect(results).to.not.be.undefined;

      expect(results?.length).to.be.greaterThan(0);
      expect(results[0].category).to.equal(CODE_SCANNING_CATEGORY_SONAR);
    });
  });


  describe('#getLatestAnalysisWithSarifData()', () => {

    it('should get a result with no filter', async () => {
      const repo = REPO_WEB_GOAT;

      const results = await codeScanning.getLatestAnalysisWithSarifData(repo)
      expect(results?.ageInSeconds).to.be.greaterThan(0);
      expect(results?.scan).to.not.be.undefined;
      expect(results?.scan.url).to.contain(repo.owner);
      expect(results?.scan.url).to.contain(repo.repo);

      expect(results?.sarif).to.not.be.undefined;
    });

    it('should get a result with a sarif id filter', async () => {
      const repo = REPO_WEB_GOAT;

      const results = await codeScanning.getLatestAnalysisWithSarifData(repo, {sarifId: WEB_GOAT_REPO_SARIF_ID})
      expect(results?.ageInSeconds).to.be.greaterThan(0);

      expect(results?.scan).to.not.be.undefined;
      expect(results?.scan.url).to.contain(repo.owner);
      expect(results?.scan.url).to.contain(repo.repo);
      expect(results?.scan.sarif_id).to.equal(WEB_GOAT_REPO_SARIF_ID);

      expect(results?.sarif).to.not.be.undefined;
    });
  })

  describe('#getOpenCodeScanningAlerts()', () => {

    it(`from ${JSON.stringify(REPO_TEST)}`, async () => {
      const results = await codeScanning.getOpenCodeScanningAlerts(REPO_TEST)
        , tools = results.getTools()
        ;

      expect(tools).to.have.length(0);
    });

    // it(`from ${JSON.stringify(REPO_GHAS_REPORTING)}`, async () => {
    //   const results = await codeScanning.getOpenCodeScanningAlerts(REPO_GHAS_REPORTING)
    //     , tools = results.getTools()
    //     ;

    //   expect(tools).to.have.length(1);
    //   expect(tools[0]).to.equal('-CodeQL-');
    // });
  });


  describe('#compareLatestAnalyses()', () => {

    it('should get results for CodeQL tool name', async() => {
      const toolName = 'CodeQL';

      const results = await codeScanning.compareLatestAnalyses(REPO_JAVA_SIMPLE_PROJECT, {toolName});
      expect(results).to.not.be.undefined;
      expect(results.repo).toBe(REPO_JAVA_SIMPLE_PROJECT);

      expect(results.head.scan.tool.name).to.equal(toolName);
      expect(results.base.scan.tool.name).to.equal(toolName);
    });

    it('should get results for CodeQL tool name and category', async() => {
      const toolName = 'CodeQL';
      const category = CODE_SCANNING_CATEGORY_SONAR

      const results = await codeScanning.compareLatestAnalyses(REPO_JAVA_SIMPLE_PROJECT, {toolName, category});
      expect(results).to.not.be.undefined;
      expect(results.repo).toBe(REPO_JAVA_SIMPLE_PROJECT);

      expect(results.head.scan.tool.name).to.equal(toolName);
      expect(results.head.scan.category).to.equal(category);

      expect(results.base.scan.tool.name).to.equal(toolName);
      expect(results.base.scan.category).to.equal(category);

      expect(results.head.scan.id).not.toBe(results.base.scan.id);
      expect(results.head.ageInSeconds).toBeLessThan(results.base.ageInSeconds);
    });
  });
});