const _ = require('lodash');
const dedent = require('dedent');

const Google = {

  APP_ID: '',
  API_KEY: '',
  CLIENT_ID: '',
  SCOPES: ['https://www.googleapis.com/auth/drive'],
  DRIVE_UPLOAD_URL: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
  SPREADSHEET_GET_URL: 'https://spreadsheets.google.com/feeds/list/1Ez_QexxBY18Dv4MEYdfvSs4e07zScFtjl5lzL7TTOf4/on4lgei/public/values?alt=json',
  SPREADSHEET_POST_URL: 'https://script.google.com/macros/s/AKfycbzOd7igcW_YiT7Z7na_ll_WDB-Z0rcDfEvDdUzHtANCtadJT-Bf/exec',

  /**
   * Check if current user has authorized this application.
   *
   * @param {Object} gapi Google `gapi` object.
   */
  authInit() {
    window.gapi.auth.authorize(
      {
        client_id: Google.CLIENT_ID,
        scope: Google.SCOPES.join(' '),
        immediate: true,
      },
      Google.handleAuthResult);
  },

  /**
   * Handle response from authorization server.
   *
   * @param {Object} authResult Authorization result.
   */
  handleAuthResult(authResult) {
    const authorizeDiv = document.getElementById('authorize-div');

    if (!authResult || authResult.error) {
      // Show auth UI, allowing the user to initiate authorization by
      // clicking authorize button.
      authorizeDiv.style.display = 'inline';
      return;
    }

    // Hide auth UI, then load client library.
    authorizeDiv.style.display = 'none';
    Google.loadDriveApi();
  },

  /**
   * Populate input fields from the spreadsheet.
   *
   * @param {Object} data JSON data object.
   */
  handleSheetInputs(data) {
    const entry = data.feed.entry;
    const inputs = { category: [], merchant: [] };

    for (let i = 0, j = entry.length; i < j; i++) {
      const item = entry[i];
      const category = item.gsx$category.$t;
      const merchant = item.gsx$merchant.$t;

      if (!_.isEmpty(category)) {
        inputs.category.push({ name: category });
      }

      if (!_.isEmpty(merchant)) {
        inputs.merchant.push({ name: merchant });
      }
    }

    return inputs;
  },

  /**
   * Load Drive API client library.
   */
  loadDriveApi() {
    window.gapi.client.load('drive', 'v3');
  },

  /**
   * Insert new file.
   *
   * @param {File} fileData File object to read data from.
   * @param {Function} callback Function to call when the request is complete.
   */
  insertFile(fileData, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = `\n--${boundary}`;
    const closeDelim = `\n--${boundary}--`;
    const reader = new FileReader();

    reader.readAsBinaryString(fileData);
    reader.onload = () => {
      const contentType = fileData.type || 'application/octet-stream';
      const metaData = JSON.stringify({ title: fileData.fileName, mimeType: contentType });
      const base64Data = btoa(reader.result);
      const multipartRequestBody = dedent`
        ${delimiter}
        Content-Type: application/json\n
        ${metaData}${delimiter}
        Content-Type: ${contentType}
        Content-Transfer-Encoding: base64\n
        ${base64Data}${closeDelim}`;
      const request = window.gapi.client.request({
        path: '/upload/drive/v2/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': `multipart/mixed; boundary="${boundary}"` },
        body: multipartRequestBody,
      });

      request.execute(callback);
    };
  },
};

export default Google;
