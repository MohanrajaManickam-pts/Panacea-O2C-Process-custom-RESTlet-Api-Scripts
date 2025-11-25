const fs = require('fs');
const path = require('path');
const glob = require('glob');
const espree = require('espree');

const sourceDir = path.resolve(__dirname, '../src');

function hasJsDoc(comments, node) {
  if (!comments || comments.length === 0) return false;

  const funcStartLine = node.loc.start.line;

  // Filter block comments starting with '*', i.e. JSDoc style
  const jsDocs = comments.filter(comment =>
    comment.type === 'Block' &&
    comment.value.trim().startsWith('*')
  );

  if (jsDocs.length === 0) return false;

  const allowedGap = 2;

  // Find the relevant JSDoc comment for this function
  const relevantJsDoc = jsDocs.find(comment =>
    comment.loc.end.line <= funcStartLine - 1 &&
    funcStartLine - comment.loc.end.line <= allowedGap
  );

  if (!relevantJsDoc) return false;

  // Parse JSDoc lines, clean up leading '*' and whitespace
  const lines = relevantJsDoc.value
    .split('\n')
    .map(line => line.trim().replace(/^\*+/, '').trim());

  // Find @param and @author tags
  const paramTags = lines.filter(line => line.startsWith('@param'));
  const authorTags = lines.filter(line => line.startsWith('@author'));

  // Validate @param tags: each should have a type and name after '@param'
  const paramRegex = /^@param\s+\{[^}]+\}\s+\S+/;
  const allParamsValid = paramTags.every(tag => paramRegex.test(tag));

  // Validate @author: must exist and have non-empty value after tag
  const hasAuthor = authorTags.length > 0;
  const authorHasValue = authorTags.some(tag => {
    const parts = tag.split(' ').filter(Boolean);
    return parts.length > 1; // '@author' + value
  });

  // Ensure param count matches function parameters count
  const expectedParamCount = node.params?.length || 0;
  const paramCountMatches = paramTags.length === expectedParamCount;

  return paramCountMatches && allParamsValid && hasAuthor && authorHasValue;
}

// Skip anonymous functions in define()/require() wrappers
function isAnonymousDefineWrapper(node) {
  return (
    !node.id &&
    node.parent &&
    node.parent.type === 'CallExpression' &&
    node.parent.callee &&
    ['define', 'require'].includes(node.parent.callee.name)
  );
}

function checkNode(node, comments, missingJsDocs) {
  const typesToCheck = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];

  if (!typesToCheck.includes(node.type)) return;

  if (isAnonymousDefineWrapper(node)) return;

  if (!hasJsDoc(comments, node)) {
    missingJsDocs.push({
      name: node.id?.name || '(anonymous)',
      line: node.loc.start.line,
    });
  }
}

function walk(node, comments, missingJsDocs) {
  checkNode(node, comments, missingJsDocs);

  for (const key in node) {
    if (!node.hasOwnProperty(key)) continue;
    if (key === 'parent') continue;

    const child = node[key];

    if (Array.isArray(child)) {
      child.forEach(n => {
        if (n && typeof n.type === 'string') {
          n.parent = node;
          walk(n, comments, missingJsDocs);
        }
      });
    } else if (child && typeof child.type === 'string') {
      child.parent = node;
      walk(child, comments, missingJsDocs);
    }
  }
}

function checkJsDocInFile(filePath) {

  const content = fs.readFileSync(filePath, 'utf8');
  const ast = espree.parse(content, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    comment: true,
    attachComment: true,
    loc: true,
  });

  const missingJsDocs = [];
  walk(ast, ast.comments || [], missingJsDocs);
  return missingJsDocs;
}

// Jest test suite
describe('JSDoc Validation', () => {
  const files = glob.sync(`${sourceDir}/**/*.js`, {
    ignore: ['**/node_modules/**', '**/__tests__/**','**/moment.js/**', '**/pts_helper.js/**'],
  });

  if (files.length === 0) {
    test('No source JS files found', () => {
      console.warn(`⚠️ No JS files found in ${sourceDir}`);
      expect(true).toBe(true);
    });
    return;
  }

  files.forEach(file => {

    // console.log(
    //   'file',file
    // )
    test(`JSDoc check for ${path.relative(sourceDir, file)}`, () => {
      let missing = checkJsDocInFile(file);

      // Filter out anonymous functions from error reporting if you want, or keep them
      missing = missing.filter(m => m.name && m.name !== '(anonymous)');

      if (missing.length > 0) {
        const missingList = missing
          .map(m => `Line ${m.line}: Function ${m.name} is missing valid JSDoc or has incomplete tags.`)
          .join('\n');
        throw new Error(`Missing or incomplete JSDoc in file ${file}:\n${missingList}`);
      }
    });
  });
});
