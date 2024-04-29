import { describe, expect, it } from 'vitest';
import { mkdirP } from '@actions/io';
import { createPDF } from './pdfWriter';
import { getTestDirectoryFilePath } from '../testUtils';

describe('pdfWriter', function () {

  it('should generate a simple pdf', async () => {
    const html = '<html><body><h1>Hello World</h1></body>'
      , file = getTestDirectoryFilePath('test.pdf')
    ;

    // Ensure the directory exists
    await mkdirP(getTestDirectoryFilePath());

    const generatePdf = await createPDF(html, file)
    expect(generatePdf).toBe(file);
    //TODO check size
  }, 60 * 1000);
});