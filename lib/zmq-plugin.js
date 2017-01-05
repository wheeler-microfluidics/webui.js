module.exports = {
    decode_content_data: (msg) => {
        var mime_type = msg.content.metadata.mime_type;
        var data = atob(msg.content.data);
        var response;

        if ((mime_type == 'application/octet-stream') ||
            (mime_type == 'text/plain')) {
            return data;
        } else if (mime_type == 'application/json') {
            return JSON.parse(data);
        } else {
            throw "Unsupported mime_type: " + mime_type;
        }
    }
}
