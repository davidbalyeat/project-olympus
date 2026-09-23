/*  Project Olympus progress server.
 *  1. Make a new Google Sheet named "Olympus Progress".
 *  2. Extensions → Apps Script. Delete whatever is there. Paste ALL of this file. Save (disk icon).
 *  3. Deploy → New deployment → gear icon → Web app.
 *       Description: Olympus    Execute as: Me    Who has access: Anyone
 *     Click Deploy. Authorize when asked (Advanced → Go to Olympus (unsafe) → Allow: it is your own script).
 *  4. Copy the Web app URL (ends in /exec). Paste it into content/config.js in the Workbench folder.
 *  Each profile becomes one row in the "Progress" tab. Column D is XP, so the sheet doubles as a tracker.
 *
 *  v2 (Sept 2026): PINs removed. Column B is kept so existing sheets keep their column
 *  positions, but it is no longer read or written. Re-deploy after pasting this in:
 *  Deploy -> Manage deployments -> pencil -> Version: New version -> Deploy.
 */
const SHEET_NAME = 'Progress';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(['Profile', '(unused)', 'Updated', 'XP', 'Rank', 'Badges', 'Sessions done', 'JSON']); sh.setFrozenRows(1); }
  return sh;
}
function rows_() {
  const v = sheet_().getDataRange().getValues(); const out = {};
  for (let i = 1; i < v.length; i++) { if (v[i][0]) out[String(v[i][0])] = { row: i + 1, updated: Number(v[i][2]) || 0, json: v[i][7] || '' }; }
  return out;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function parse_(s) { try { return JSON.parse(s || '{}'); } catch (e) { return {}; } }

function doGet(e) {
  const p = (e && e.parameter) || {}; const a = p.action || 'ping';
  if (a === 'ping') return out_({ ok: true, v: 2, t: Date.now() });
  const rows = rows_();
  if (a === 'list') {
    const list = Object.keys(rows).filter(n => n !== '__settings__').map(n => { const d = parse_(rows[n].json); return { name: n, xp: d.xp || 0, updated: rows[n].updated }; });
    return out_({ ok: true, profiles: list });
  }
  if (a === 'load') {
    const r = rows[p.profile]; if (!r) return out_({ ok: false, error: 'no such profile' });
    return out_({ ok: true, data: parse_(r.json), updated: r.updated });
  }
  return out_({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  let b = {}; try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad json' }); }
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = sheet_(); const rows = rows_();
    if (b.action === 'save') {
      const name = String(b.profile || '').trim(); if (!name || name === '__settings__') return out_({ ok: false, error: 'bad profile name' });
      const r = rows[name];
      const d = b.data || {}; const now = Date.now();
      const vals = [name, '', now, d.xp || 0, b.rank || '', Object.keys(d.badges || {}).length, b.sessionsDone || 0, JSON.stringify(d)];
      if (r) sh.getRange(r.row, 1, 1, vals.length).setValues([vals]); else sh.appendRow(vals);
      return out_({ ok: true, updated: now });
    }
    return out_({ ok: false, error: 'unknown action' });
  } finally { lock.releaseLock(); }
}
