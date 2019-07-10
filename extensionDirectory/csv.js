    function convertArrayOfObjectsToCSV(args) {
        var result, ctr, keys, columnDelimiter, lineDelimiter, data;

        data = args.data || null;
        if (data == null || !data.length) {
            return null;
        }

        columnDelimiter = args.columnDelimiter || ',';
        lineDelimiter = args.lineDelimiter || '\n';

        keys = Object.keys(data[0]);

        result = '';
        result += keys.join(columnDelimiter);
        result += lineDelimiter;

        data.forEach(function(item) {
            ctr = 0;
            keys.forEach(function(key) {
                if (ctr > 0) result += columnDelimiter;

                result += item[key];
                ctr++;
            });
            result += lineDelimiter;
        });

        return result;
    }

    function downloadCSV(args) {
        var data_array = args.data_array;
        var csv = convertArrayOfObjectsToCSV({
        data: data_array
        });
        if (csv == null)
        return;

        var blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
        var url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url: url,
          filename: args.filename
        });
}