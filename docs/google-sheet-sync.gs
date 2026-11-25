/**
 * 48 Hour Rebuild: lead sheet sync. This runs inside Kent's Google Sheet.
 *
 * Setup, once:
 * 1. Open the Google Sheet. Extensions > Apps Script. Paste this whole file over what is there.
 * 2. Pick "makeSecret" in the function list and press Run (approve the Google prompt). It makes a
 *    random secret and stores it in Project Settings > Script properties, under SECRET.
 * 3. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone.
 * 4. In Vercel set SHEETS_WEBHOOK_URL to the web app URL (ends in /exec) and
 *    SHEETS_WEBHOOK_SECRET to the SECRET value from Script properties, then redeploy the site.
 *
 * The site sends one lead at a time. The row is found by the ID column and updated, or added
 * if it is new. The header row is written by the site, so new columns appear on their own.
 * After editing this file, use Deploy > Manage deployments > Edit > New version (the URL stays the same).
 */
const TAB = "Leads"

/** Run once. Keeps an existing secret, so running it again changes nothing. */
function makeSecret() {
  const props = PropertiesService.getScriptProperties()
  if (!props.getProperty("SECRET")) props.setProperty("SECRET", Utilities.getUuid() + Utilities.getUuid())
  return "SECRET is set. Copy it from Project Settings > Script properties."
}

function doPost(e) {
  const out = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)
  let body
  try {
    body = JSON.parse(e.postData.contents)
  } catch (err) {
    return out({ ok: false, error: "bad json" })
  }
  const SECRET = PropertiesService.getScriptProperties().getProperty("SECRET")
  if (!SECRET || body.secret !== SECRET) return out({ ok: false, error: "unauthorized" })
  if (!body.id || !Array.isArray(body.columns) || !Array.isArray(body.values)) return out({ ok: false, error: "bad payload" })

  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sheet = ss.getSheetByName(TAB) || ss.insertSheet(TAB)
    const cols = body.columns

    // Header row: written by the site so the two never drift.
    const header = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : []
    if (cols.join("|") !== header.slice(0, cols.length).join("|")) {
      sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold")
      sheet.setFrozenRows(1)
    }

    const idCol = cols.indexOf("ID") + 1
    let row = 0
    if (sheet.getLastRow() > 1) {
      const ids = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues()
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] === body.id) {
          row = i + 2
          break
        }
      }
    }

    // Plain text only: a value starting with = or + must never run as a formula.
    const values = body.values.map((v) => (typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v))
    if (row) {
      const old = sheet.getRange(row, 1, 1, cols.length).getValues()[0]
      ;(body.keep_if_blank || []).forEach((name) => {
        const i = cols.indexOf(name)
        if (i >= 0 && values[i] === "" && old[i] !== "") values[i] = old[i]
      })
      // A booked lead stays booked when a later, smaller update arrives.
      const s = cols.indexOf("Status")
      if (s >= 0 && old[s] === "Call booked" && values[s] !== "Call booked") values[s] = old[s]
    } else {
      row = Math.max(sheet.getLastRow(), 1) + 1
    }
    sheet.getRange(row, 1, 1, cols.length).setValues([values])
    return out({ ok: true, row: row })
  } finally {
    lock.releaseLock()
  }
}
