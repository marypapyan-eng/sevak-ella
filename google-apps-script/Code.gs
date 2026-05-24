/**
 * RSVP → Google Таблица «Свадьба – ответы»
 * ID: 13K_kmKb7-DkNshI1zJYg1BR0T5DfFcOrncMQUhCBxYY
 *
 * Развёртывание: см. SETUP.md
 */

var SHEET_ID = '13K_kmKb7-DkNshI1zJYg1BR0T5DfFcOrncMQUhCBxYY';

var ATTENDANCE_LABELS = {
  yes: 'Я приду / Мы придём',
  no: 'Прийти не получается',
};

function doGet() {
  return jsonResponse({ ok: true, message: 'RSVP endpoint' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    ensureHeaders_(sheet);

    var attendance = '';
    var name = '';
    var attendanceLabel = '';

    if (e.postData && e.postData.contents) {
      var contentType = e.postData.type || '';

      if (contentType.indexOf('application/json') !== -1) {
        var body = JSON.parse(e.postData.contents);
        attendance = body.attendance || '';
        name = (body.name || '').trim();
        attendanceLabel = body.attendanceLabel || '';
      } else {
        var params = parseFormBody_(e.postData.contents);
        attendance = params.attendance || '';
        name = (params.name || '').trim();
        attendanceLabel = params.attendanceLabel || '';
      }
    } else if (e.parameter) {
      attendance = e.parameter.attendance || '';
      name = (e.parameter.name || '').trim();
      attendanceLabel = e.parameter.attendanceLabel || '';
    }

    if (!attendance || !name) {
      return jsonResponse({ ok: false, error: 'Заполните ответ и имя' });
    }

    if (!attendanceLabel) {
      attendanceLabel = ATTENDANCE_LABELS[attendance] || attendance;
    }

    sheet.appendRow([new Date(), attendanceLabel, name]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Дата и время', 'Ответ', 'Имя и фамилия']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  }
}

function parseFormBody_(contents) {
  var params = {};

  contents.split('&').forEach(function (pair) {
    var parts = pair.split('=');
    if (parts.length < 2) return;
    var key = decodeURIComponent(parts[0].replace(/\+/g, ' '));
    var value = decodeURIComponent(parts.slice(1).join('=').replace(/\+/g, ' '));
    params[key] = value;
  });

  return params;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
