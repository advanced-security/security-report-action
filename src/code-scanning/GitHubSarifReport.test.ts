import path from 'path';
import fs from 'fs';

import { describe, expect, test } from 'vitest';

import {getSampleSarifDirectory} from '../testUtils';
import {GitHubSarifReport} from './GitHubSarifReport';


describe('SarifReport', () => {

  describe('#constructor()', () => {

    const data = loadSarifFile('octodemo', 'test', 'github_codeql_sarif.json');

    test('should load a CodeQL SARIF report', () => {
      const report = new GitHubSarifReport(data);
      expect(report.rules.length).to.equal(108);

      const rule = report.rules[0];
      expect(rule.id).to.equal('java/android/arbitrary-apk-installation');
      expect(rule.name).to.equal('java/android/arbitrary-apk-installation');

      expect(rule.precision).to.equal('medium');
      expect(rule.cwes).to.deep.equal(['cwe-094']);
      expect(rule.isSecurity).to.be.true;
      expect(rule.isReliability).to.be.false;
    });
  });
});

function loadSarifFile(organization: string, repo: string, filename: string) {
  const file = path.join(getSampleSarifDirectory(), organization, repo, filename);
  const data = fs.readFileSync(file, 'utf8');
  return JSON.parse(data);
}