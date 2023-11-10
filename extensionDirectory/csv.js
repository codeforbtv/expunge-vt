function convertArrayOfObjectsToCSV(args) {
  let result, ctr, keys, columnDelimiter, lineDelimiter, contentQuoting, data;

  data = args.data || null;
  if (data == null || !data.length) {
    return null;
  }

  columnDelimiter = args.columnDelimiter || ',';
  lineDelimiter = args.lineDelimiter || '\n';
  contentQuoting = args.quoting || '"';

  keys = Object.keys(data[0]);

  result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach(function (item) {
    ctr = 0;
    keys.forEach(function (key) {
      if (ctr > 0) result += columnDelimiter;
      result += contentQuoting;
      result += item[key];
      result += contentQuoting;
      ctr++;
    });
    result += lineDelimiter;
  });

  return result;
}

function downloadCSV(args) {
  let data_array = args.data_array;
  let csv = convertArrayOfObjectsToCSV({
    data: data_array,
  });
  if (csv == null) return;

  let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  let url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: args.filename,
  });
}
