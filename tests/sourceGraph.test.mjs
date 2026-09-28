import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import * as espree from 'espree';

const root = resolve('src');
const filesIn = directory => readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => entry.isDirectory()
    ? filesIn(resolve(directory, entry.name))
    : [resolve(directory, entry.name)]);
const files = filesIn(root).filter(file => /\.(js|jsx)$/.test(file));
const graph = new Map();
const missing = [];

for (const file of files) {
  const ast = espree.parse(readFileSync(file, 'utf8'), {
    ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true },
  });
  const imports = ast.body
    .filter(node => ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type))
    .map(node => node.source?.value)
    .filter(source => source?.startsWith('.'));
  const dependencies = [];
  for (const source of imports) {
    const base = resolve(dirname(file), source);
    const dependency = [base, `${base}.js`, `${base}.jsx`, `${base}/index.js`]
      .find(candidate => existsSync(candidate));
    if (!dependency) missing.push(`${relative(root, file)} -> ${source}`);
    else if (/\.(js|jsx)$/.test(dependency)) dependencies.push(dependency);
  }
  graph.set(file, dependencies);
}

test('local source imports resolve', () => assert.deepEqual(missing, []));

test('source imports contain no cycles', () => {
  const visited = new Set();
  const visiting = [];
  function walk(file) {
    assert.ok(!visiting.includes(file), `Import cycle: ${[...visiting, file].map(f => relative(root, f)).join(' -> ')}`);
    if (visited.has(file)) return;
    visiting.push(file);
    for (const dependency of graph.get(file) || []) walk(dependency);
    visiting.pop();
    visited.add(file);
  }
  for (const file of graph.keys()) walk(file);
});

test('auth provider lives only at the root; navigation owns notification subscription', () => {
  assert.equal(readFileSync('src/App.jsx', 'utf8').includes('<AuthProvider'), false);
  assert.equal((readFileSync('src/main.jsx', 'utf8').match(/<AuthProvider>/g) || []).length, 1);
  assert.equal(readFileSync('src/components/nav/UserMenu.jsx', 'utf8').includes('useNotifications'), false);
  assert.equal((readFileSync('src/components/nav/Navigation.jsx', 'utf8').match(/useNotifications\(/g) || []).length, 1);
});

test('global and vendor CSS have one JavaScript entry', () => {
  const cssImports = files.filter(file => /import\s+['"][^'"]+\.css['"]/.test(readFileSync(file, 'utf8')));
  assert.deepEqual(cssImports.map(file => relative(root, file)), ['main.jsx']);
});