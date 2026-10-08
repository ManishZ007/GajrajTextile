import { zipSync, strToU8 } from "fflate";
export type Cell = string | number | boolean | null | undefined;
export interface Sheet { name: string; headers: string[]; rows: Cell[][] }
const xml = (value: string) => value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function column(n:number):string {let s="";for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
// Inline strings keep customer-entered text literal, including leading =, +, - and @.
export function makeWorkbook(sheets:Sheet[]):Uint8Array {
 const files:Record<string,Uint8Array>={};const put=(path:string,s:string)=>files[path]=strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+s);
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 put('[Content_Types].xml',`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
 put('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 put('xl/workbook.xml',`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`);
 put('xl/_rels/workbook.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
 put('xl/styles.xml',`<styleSheet xmlns="${ns}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
 sheets.forEach((sheet,i)=>{
  if(sheet.rows.length>1048575)throw new Error('Report exceeds Excel row limit.');
  const rows=[sheet.headers,...sheet.rows].map((row,r)=>`<row r="${r+1}"${r===0?' ht="24" customHeight="1"':''}>${row.map((v,c)=>{const ref=column(c)+(r+1);return typeof v==='number'&&Number.isFinite(v)?`<c r="${ref}"><v>${v}</v></c>`:`<c r="${ref}" t="inlineStr" s="${r===0?1:0}"><is><t xml:space="preserve">${xml(String(v??'').slice(0,32767))}</t></is></c>`;}).join('')}</row>`).join('');
  put(`xl/worksheets/sheet${i+1}.xml`,`<worksheet xmlns="${ns}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${sheet.headers.map((h,c)=>`<col min="${c+1}" max="${c+1}" width="${Math.min(42,Math.max(18,h.length+3))}" customWidth="1"/>`).join('')}</cols><sheetData>${rows}</sheetData><autoFilter ref="A1:${column(sheet.headers.length-1)}${sheet.rows.length+1}"/></worksheet>`);
 });
 return zipSync(files,{level:6});
}
export function downloadWorkbook(name:string,sheets:Sheet[]) {
 const bytes=makeWorkbook(sheets);const blob=new Blob([new Uint8Array(bytes).buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
