const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const ts=require('typescript');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/components/customization/types.ts'),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exportsObject={};new Function('exports',code)(exportsObject);
const {emptyRegion,validateMapping}=exportsObject;
const parts=[{id:'0.0:0',label:'Body',uv:true,editable:true},{id:'0.1:0',label:'No UV',uv:false,editable:true}];
test('valid category mapping accepts a separate body and texture slot',()=>{
  assert.deepEqual(validateMapping({modelKey:'test',regions:{body:{...emptyRegion(),targets:['0.1:0']},padar:{...emptyRegion(),targets:['0.0:0']}}},parts),[]);
});
test('stale targets and unwrapped texture parts cannot be saved',()=>{
  assert.match(validateMapping({modelKey:'test',regions:{body:{...emptyRegion(),targets:['0.9:0']}}},parts).join(' '),/no longer exists/);
  assert.match(validateMapping({modelKey:'test',regions:{padar:{...emptyRegion(),targets:['0.1:0']}}},parts).join(' '),/no UV/);
});
test('conflicting assignments and unsafe transform values are rejected',()=>{
  const region={...emptyRegion(),targets:['0.0:0']};
  assert.match(validateMapping({modelKey:'test',regions:{body:region,padar:region}},parts).join(' '),/two regions/);
  for(const value of [0,NaN,Infinity,101]) assert.ok(validateMapping({modelKey:'test',regions:{padar:{...region,repeatX:value}}},parts).length);
});
