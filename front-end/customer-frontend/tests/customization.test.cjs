const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(name) {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/customization/', name + '.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {}; new Function('exports', compiled)(exports); return exports;
}
const { validSelections, appearanceFor } = load('selection');
const { validateMapping } = load('types');
const data = {
  mapping: { modelKey: 'model', regions: { body: { targets: ['0.1:0'], repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0, rotation: 0 } } },
  bodyColors: [{ id: 'red', name: 'Red', hexCode: '#ff0000' }],
  borderColors: [], border: [], padar: [], butti: [{ id: 'unmapped', url: 'https://example.com' }]
};
test('only category options on mapped regions can be selected', () => {
  const chosen = validSelections(data, { bodyColor: 'red', butti: 'unmapped', border: 'foreign' });
  assert.equal(chosen.bodyColor, 'red'); assert.equal(chosen.butti, ''); assert.equal(chosen.border, '');
  assert.equal(validSelections(data, { bodyColor: 'javascript:bad' }).bodyColor, '');
});
test('appearance resolves option IDs using server supplied colors', () => {
  assert.equal(appearanceFor(data, validSelections(data, { bodyColor: 'red' })).bodyColor, '#ff0000');
  assert.equal(appearanceFor(data, validSelections(data, {})).bodyColor, '');
});
test('a replaced or incompatible model cannot silently pass preview validation', () => {
  assert.ok(validateMapping(data.mapping, [{ id: '0.2:0', editable: true, uv: true }]).length);
  assert.deepEqual(validateMapping(data.mapping, [{ id: '0.1:0', editable: true, uv: true }]), []);
});
