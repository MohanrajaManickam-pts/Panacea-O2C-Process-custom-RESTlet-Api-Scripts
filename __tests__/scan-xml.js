const fs = require('fs');
const path = require('path');

const manualReadFileContent = (xmlFile, fileName) => {
    // exitWithError boolean
    let exitWithErrorBool = false;
    // Sample XML file as a string
    const xmlString = xmlFile;

    // Split the XML string into lines
    const lines = xmlString.split('\n');

    // Initialize variables to keep track of line number and tag counts
    let lineNumber = 0;
    let descriptionTagCount = 0; // This tracks the number of <description> tags found
  
  
    // Loop through each line of the XML
    for (let i = 0; i < lines.length; i++) {
        lineNumber += 1;
        const line = lines[i].trim();

        // Skip empty lines
        if (line.length === 0) {
            // eslint-disable-next-line no-continue
            continue;
        }

        // Check if the line contains a <description> tag
        if (line.includes('<description>') && line.includes('</description>')) {
            descriptionTagCount += 1;
        //    console.log(`Description tag found on line ${lineNumber} in file ${fileName}`);
            // Do something with the description tag, e.g., extract its content
            const descriptionText = line.substring(line.indexOf('>') + 1, line.lastIndexOf('<'));
          //  console.log(`Description text: ${descriptionText}`);
            const isDescriptionEmpty = descriptionText.length === 0;
            if (isDescriptionEmpty === true) {
                const descTitleLog = `Empty <description> element found in file ${fileName} on line ${lineNumber}, please update DESCRIPTION tag for proper documentation.`;
                console.log(`::error file=${fileName},line=${lineNumber}::${descTitleLog}`);
                exitWithErrorBool = true;
            }
         //   console.log(`Description tag content is empty: ${isDescriptionEmpty}`);
        }
    }

    // Check if description tag is missing
    if (descriptionTagCount === 0) {
        const descTagMissingLog = `Missing <description> tag in file ${fileName}, please add it for proper documentation.`;
        console.log(`::error file=${fileName}::${descTagMissingLog}`);
        exitWithErrorBool = true;
    }

    // Return true if there were no errors
    return exitWithErrorBool;
};

const scanDir = (dirPath) => {
    const xmlFiles = [];
    const files = fs.readdirSync(dirPath);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            xmlFiles.push(...scanDir(filePath)); // recursively call scanDir
        } else if (stats.isFile() && file.endsWith('.xml')) {
            xmlFiles.push(filePath);
        }
    }
    return xmlFiles;
};

describe('Check description tag under src/objects', () => {
    let xmlFiles = [];
    const directoryPath = './src/Objects';
    // Check if directory exists
    if (fs.existsSync(directoryPath)) {
        xmlFiles = scanDir(directoryPath);
    }

    xmlFiles.forEach((file) => {
        const xml = fs.readFileSync(file, 'utf8');
        const currScenarioBool = manualReadFileContent(xml, file);

        it(`should return true when <description> tag is missing or empty${file}`, () => {
            expect(currScenarioBool).toBe(false); // Test will fail if <description> is missing or empty
        });
    });
});
