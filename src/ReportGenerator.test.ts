import { Octokit } from '@octokit/rest';
import { describe, expect, test } from 'vitest';
import ReportGenerator from './ReportGenerator';
import { NullLogger } from './logging/NullLogger';
import { ConsoleLogger } from './logging/ConsoleLogger';
import { getGitHubTestToken, getTestDirectoryFilePath } from './testUtils';
import { fail } from 'assert';

describe('ReportGenerator', function () {

  const TOKEN: string = getGitHubTestToken();

  ['octodemo-db/forrester-webgoat',  'octodemo-db/simple-java-project'].forEach(repository => {
    test(`should generate a report for ${repository}`, async () => {
      const generatorConfig = {
        octokit: new Octokit({auth: TOKEN}),
        repository: repository,
        ref: 'main',
        outputDirectory: getTestDirectoryFilePath(repository),
        templating: {
          name: 'summary'
        },
        include: {
          codeScanning: true,
          secretScanning: true,
          softwareCompositionAnalysis: true
        },
        logger: new NullLogger()
      }

      const generator = new ReportGenerator(generatorConfig);
      const file = await generator.run();
      expect(file).to.contain(generatorConfig.outputDirectory);
      console.log(`Report generated at ${file}`);
    }, 60 * 1000);
  });

  test('should fail correctly for a repository that does not exist', async () => {
    const generatorConfig = {
      octokit: new Octokit({auth: TOKEN}),
      repository: 'octodemo-db/forrester-webgoat-non-existant',
      ref: 'main',
      outputDirectory: getTestDirectoryFilePath('forrester-webgoat-non-existant'),
      templating: {
        name: 'summary'
      },
      include: {
        codeScanning: true,
        secretScanning: true,
        softwareCompositionAnalysis: true
      },
      // logger: new ConsoleLogger()
      logger: new NullLogger()
    }

    const generator = new ReportGenerator(generatorConfig);
    try {
      await generator.run();
      fail(`Expected an error to have been thrown from invocation`);
    } catch (err) {
      expect(err.message).to.contain('Not Found');
    }
  }, 60 * 1000);
});