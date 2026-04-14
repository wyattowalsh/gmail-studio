/**
 * Returns the remaining daily email quota for the user.
 * @customfunction
 */
function GET_REMAINING_QUOTA() {
  try {
    return MailApp.getRemainingDailyQuota();
  } catch (e) {
    return 'Error: ' + e.message;
  }
}
