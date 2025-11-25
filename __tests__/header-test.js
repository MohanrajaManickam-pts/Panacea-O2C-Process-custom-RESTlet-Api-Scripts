/**
* Jest test Script which checks files Jsdoc header and if it has the mandatory pragma details
*/ 
/* eslint-disable import/no-extraneous-dependencies */

import { extract, parseWithComments } from 'jest-docblock';

import dirTree from 'directory-tree';

import { readFileSync } from 'node:fs';
 
const aFileContents = [];

const IGNORED_PATHS = [/SuiteScripts[\\/]+PTS[\\/]+Libraries[\\/]+/];

function isIgnored(path) {
  return IGNORED_PATHS.some((regex) => regex.test(path.replace(/\\/g, '/')));
}
 
dirTree('./src', { extensions: /\.js$/ }, (oFile) => {

  if (isIgnored(oFile.path)) return;

  const fileText = readFileSync(oFile.path, 'utf8', (err) => {

    if (err) throw err;

  });

  // Ignore minified and condensed js files

  if (fileText.startsWith('function') || fileText.startsWith('(function')) {

    return;

  }

  // eslint-disable-next-line no-param-reassign

  oFile.commentBlock = parseWithComments(extract(fileText));

  aFileContents.push(oFile);

});
 
describe('Each NetSuite script should have a valid JsDoc style header', () => {

  const SCRIPTYPE_NAME_REGEX = /Helper|ClientScript|Suitelet|UserEventScript|ScheduledScript|MapReduceScript|CustomRecordActionScript|WorkflowActionScript|Restlet|MassUpdateScript|BundleInstallationScript|SDFInstallationScript|Portlet/;

  const VERSION_REGEX = /2.0|2.1/;

  const COMPANY_NAME_REGEX = /Prateek/;
 
  it('should start with a comment block', () => {

    aFileContents.forEach((oFile) => {

      try {

        expect(oFile.commentBlock).not.toBeUndefined();

        expect(oFile.commentBlock).not.toBe('');

      } catch (e) {

        console.log(`::error file=${oFile.name},line=1::Each NetSuite script should have a valid JsDoc style header`);

        expect(e).toEqual({

          error: oFile.name,

        });

      }

    });

  });

  it('should contain an @author pragma with a value', () => {

    aFileContents.forEach((oFile) => {

      try {

        expect(oFile.commentBlock.pragmas.author).not.toBe('');

        const fName = (oFile.commentBlock.pragmas.author).split(' ');

        const arr1 = fName.length;

        expect(arr1).not.toBe(0);

      } catch (e) {

        console.log(`::error file=${oFile.name},line=1::Script JsDoc header should contain an @author`);

        expect(e).toEqual({

          error: oFile.name,

        });

      }

    });

  });
 
  // it('should contain a @copyright pragma with a year and the company name', () => {

  //   aFileContents.forEach((oFile) => {

  //     try {

  //       //expect(oFile.commentBlock.pragmas.copyright).not.toBeUndefined();

  //      // expect(oFile.commentBlock.pragmas.copyright).not.toBe('');

  //      // expect(oFile.commentBlock.pragmas.copyright).toMatch(/^20[0-9]{2}/);

  //      // expect(oFile.commentBlock.pragmas.copyright).toMatch(COMPANY_NAME_REGEX);

  //     } catch (e) {

  //       console.log(`::error file=${oFile.name},line=1::Script JsDoc header should contain a valid @copyright pragma`);

  //       expect(e).toEqual({

  //         error: oFile.name,

  //       });

  //     }

  //   });

  // });
 
  it('should contain an @NApiVersion pragma with one of [1.0, 2.0, 2.1]', () => {

    aFileContents.forEach((oFile) => {

      try {

        if (!Object.keys(oFile.commentBlock.pragmas).includes('NotNetSuite')) {

          expect(oFile.commentBlock.pragmas).toHaveProperty('NApiVersion');

          expect(oFile.commentBlock.pragmas.NApiVersion).toMatch(VERSION_REGEX);

        }

      } catch (e) {

        console.log(`::error file=${oFile.name}::Script JsDoc header should contain a valid @NApiVersion pragma`);

        expect(e).toEqual({

          error: oFile.name,

        });

      }

    });

  });
 
  it('when it contains an @NScriptType pragma then the value must match one of [ClientScript, Suitelet, UserEventScript, ScheduledScript, MapReduceScript]', () => {

    aFileContents.forEach((oFile) => {

      try {

        if (oFile.commentBlock.pragmas.NScriptType) {

          expect(oFile.commentBlock.pragmas.NScriptType).not.toBeUndefined();

          expect(oFile.commentBlock.pragmas.NScriptType).toMatch(SCRIPTYPE_NAME_REGEX);

        }

      } catch (e) {

        console.log(`::error file=${oFile.name},line=1::The NScriptType pragma must contain a valid script type`);

        expect(e).toEqual({

          error: oFile.name,

        });

      }

    });

  });

});
 