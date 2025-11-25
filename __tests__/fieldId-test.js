const fs = require('fs');
const path = require('path');

// Allowed fieldId prefixes
const allowedPrefixes = [
    'custscript_pts_',
    'custbody_pts_',
    'custcol_pts_',
    'custrecord_pts_',
    "custbody_",
    "entity"
];

// Regex to match fieldId inside setValue({ fieldId: '...' })
const fieldIdRegex = /setValue\s*\(\s*{[^}]*fieldId\s*:\s*['"`]([^'"`]+)['"`]/g;

describe('FieldId Naming Convention', () => {
    const scriptsDir = path.join(__dirname, '../src');

    validate(scriptsDir);

});
 

function validate(scriptsDir) {
    fs.readdirSync(scriptsDir).forEach((file) => {

        const filePath = path.join(scriptsDir, file);
        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
            validate(filePath)

        } else {

            const content = fs.readFileSync(filePath, 'utf8');

            test(`${file} should use allowed fieldId prefixes in setValue`, () => {
                let match;
                const badFieldIds = [];

                while ((match = fieldIdRegex.exec(content)) !== null) {
                    const fieldId = match[1];
                    const isValid = allowedPrefixes.some(prefix => fieldId.startsWith(prefix));
                    if (!isValid) {
                        badFieldIds.push(fieldId);
                    }
                }

                expect(badFieldIds).toEqual([]);
            });
        }

    });
}
