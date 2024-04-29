import * as fs from 'fs';

import {describe, test, expect } from 'vitest';

import { CodeScanningDelta } from './CodeScanningDelta';
import {getCodeScanningComparisonDirectory} from '../testUtils';

describe('CodeScanningDelta', () => {

  function loadCodeScanningDelta(filename: string): CodeScanningDelta {
    const dataContent = fs.readFileSync(getCodeScanningComparisonDirectory(filename));
    const delta = new CodeScanningDelta(JSON.parse(dataContent.toString()));
    expect(delta).to.not.be.undefined;
    return delta;
  }

  test('no changes in results or rules', () => {
    const delta = loadCodeScanningDelta('comparison.json');
    const summary = delta.getDeltaSummary();
    expect(summary).to.not.be.undefined;

    const artifactsDelta = summary.artifacts;
    expect(artifactsDelta.delta.added.length).to.equal(0);
    expect(artifactsDelta.delta.removed.length).to.equal(0);
    expect(artifactsDelta.delta.existing.length).to.equal(11);

    const rulesDelta = summary.rules;
    expect(rulesDelta.head.count).to.equal(142);
    expect(rulesDelta.base.count).to.equal(142);

    expect(rulesDelta.delta.added.length).to.equal(0);
    expect(rulesDelta.delta.removed.length).to.equal(0);
    expect(rulesDelta.delta.existing.length).to.equal(142);

    const resultsDelta = summary.results;
    expect(resultsDelta.head.count).to.equal(51);
    expect(resultsDelta.base.count).to.equal(51);
    expect(resultsDelta.delta.added.length).to.equal(0);
    expect(resultsDelta.delta.removed.length).to.equal(0);
    expect(resultsDelta.delta.existing.length).to.equal(51);
  });

  test('differences in artifacts and results', () => {
    const delta = loadCodeScanningDelta('differences.json');
    const summary = delta.getDeltaSummary();
    expect(summary).to.not.be.undefined;

    const rulesDelta = summary.rules;
    expect(rulesDelta.head.count).to.equal(142);
    expect(rulesDelta.base.count).to.equal(142);
    expect(rulesDelta.delta.added.length).to.equal(0);
    expect(rulesDelta.delta.removed.length).to.equal(0);
    expect(rulesDelta.delta.existing.length).to.equal(142);

    const artifactsDelta = summary.artifacts;
    expect(artifactsDelta.delta.added.length).to.equal(0);
    expect(artifactsDelta.delta.removed.length).to.equal(1);
    expect(artifactsDelta.delta.existing.length).to.equal(10);

    const resultsDelta = summary.results;
    expect(resultsDelta.delta.added.length).to.equal(0);
    expect(resultsDelta.delta.removed.length).to.equal(4);
    expect(resultsDelta.delta.existing.length).to.equal(47);
  });
});