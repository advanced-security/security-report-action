import * as path from 'path';

const TEST_SAMPLES_DIRECTORY: string = path.join(__dirname, '..', 'test-samples');

export function getTestDirectoryFilePath(...filePath): string {
  const args = [__dirname, '..', '_tmp', ...filePath];
  return path.join(...args);
}

export function getSampleDataDirectory(...dir): string {
  const args = [TEST_SAMPLES_DIRECTORY, ...dir];
  return path.join(...args);
}

export function getSampleSarifDirectory(...dir): string {
  const args = [TEST_SAMPLES_DIRECTORY, 'sarif', ...dir];
  return path.join(...args);
}

export function getSampleReportJsonDirectory(...dir): string {
  const args = [TEST_SAMPLES_DIRECTORY, 'reportJson', ...dir];
  return path.join(...args);
}

export function getCodeScanningComparisonDirectory(...dir): string {
  const args = [TEST_SAMPLES_DIRECTORY, 'code-scanning-comparison', ...dir];
  return path.join(...args);
}

export function getGitHubTestToken(): string {
  const tokenName = 'GH_TEST_TOKEN';

  const token = process.env[tokenName];

  if (!token) {
    throw new Error(`GitHub Token was not set for environment variable "${tokenName}"`);
  }
  return token;
}