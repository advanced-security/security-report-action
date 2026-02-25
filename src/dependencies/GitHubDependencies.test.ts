import { describe, expect, it, beforeAll } from 'vitest';
import GitHubDependencies from './GitHubDependencies';

import { Octokit } from '@octokit/rest';
import DependencySet from './DependencySet';
import Dependency from './Dependency';
import { getGitHubTestToken } from '../testUtils';

describe('GitHubDependencies', function ()  {

  const testRepo = {
    owner: 'octodemo-db',
    repo: 'demo-vulnerabilities-ghas'
  };

  let ghDeps: GitHubDependencies;

  beforeAll(() => {
    const octokit = new Octokit({auth: getGitHubTestToken()});
    ghDeps = new GitHubDependencies(octokit);
  });

  describe('#getAllDependencies()', () => {

    it(`from ${JSON.stringify(testRepo)}`, async () => {
      const results: DependencySet[] = await ghDeps.getAllDependencies(testRepo);

      expect(results).to.have.length.greaterThan(0);
      expect(results[0]).to.have.property('count').to.be.greaterThan(0);

      const dep: Dependency = results[0].dependencies[0];
      expect(dep.packageType).to.equal('MAVEN');
    }, 10 * 1000);
  });

  describe('#getAllVulnerabilities()', () => {

    it(`from ${JSON.stringify(testRepo)}`, async () => {
      const results = await ghDeps.getAllVulnerabilities(testRepo);

      expect(results).to.have.length.greaterThan(10);
    }, 10 * 1000);
  });
});