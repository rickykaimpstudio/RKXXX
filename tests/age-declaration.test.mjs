import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise the exact browser validator against a fixed date.
const code=readFileSync('app.mjs','utf8');
const start=code.indexOf('function ageOnCalendarDate(');
const end=code.indexOf('const dobInput =',start);
assert.ok(start>=0 && end>start, 'ageOnCalendarDate function is present');
const calculate=runInNewContext(code.slice(start,end)+'\nageOnCalendarDate;');

test('18 ans aujourd’hui passe, une journée plus jeune échoue',()=>{
  const now=new Date(2026,10,11,12,0);
  assert.equal(calculate('2008-11-11',now),18);
  assert.equal(calculate('2008-11-12',now),17);
  assert.equal(calculate('2008-11-10',now),18);
});
test('dates invalides et dates futures refusées',()=>{
  const now=new Date(2026,10,11,12,0);
  for(const val of ['','2000-02-30','2027-01-01','2000-13-04','2000-00-01','2002-11-00','hello']){
    assert.equal(calculate(val,now),null, val);
  }
});
test('dates bissextiles calculées correctement',()=>{
  assert.equal(calculate('2008-02-29',new Date(2026,1,28,12)),17);
  assert.equal(calculate('2008-02-29',new Date(2026,2,1,12)),18);
});
