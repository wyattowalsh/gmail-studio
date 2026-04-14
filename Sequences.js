/**
 * Logic for handling email sequences.
 */

function handleSequenceNextStep(sentPayload) {
  if (!sentPayload.sequence_id || !sentPayload.step_number) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sequenceSheet = ss.getSheetByName('Sequences');
  if (!sequenceSheet) return;

  const nextStepNumber = sentPayload.step_number + 1;
  const data = sequenceSheet.getDataRange().getValues();
  if (data.length < 2) return;

  const headers = data[0].map((h) => String(h).trim().toLowerCase());
  const rows = data.slice(1);

  const nextStepDef = rows.find((row) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i]));
    return String(obj.sequence_id) === sentPayload.sequence_id && Number(obj.step_number) === nextStepNumber;
  });

  if (!nextStepDef) return;

  // Create a payload for the next step
  const obj = {};
  headers.forEach((h, i) => (obj[h] = nextStepDef[i]));

  const delayDays = Number(obj.delay_days) || 1;
  const scheduledTime = new Date();
  scheduledTime.setDate(scheduledTime.getDate() + delayDays);

  const outboundHeaders = getOutboundHeaders();

  const newRow = outboundHeaders.map((h) => {
    const head = String(h).trim().toLowerCase();
    if (head === 'recipient') return sentPayload.recipient;
    if (head === 'first_name') return sentPayload.first_name;
    if (head === 'delivery_mode') return sentPayload.delivery_mode || 'SEND';
    if (head === 'scheduled_time') return scheduledTime;
    if (head === 'status') return 'SCHEDULED';
    if (head === 'sequence_id') return sentPayload.sequence_id;
    if (head === 'step_number') return nextStepNumber;
    return obj[head] || '';
  });

  appendOutboundRows([
    outboundHeaders.reduce((payload, header, index) => {
      payload[header] = newRow[index];
      return payload;
    }, {}),
  ]);
}

if (typeof module !== 'undefined') {
  module.exports = { handleSequenceNextStep };
}
