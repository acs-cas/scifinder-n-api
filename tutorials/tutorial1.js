const colors = require('colors');
const https = require('https');


// Tutorial 1
console.log("Introduction to the oauth2 meta data\n".bold);

console.log("By using a simple https web call to https://scifinder-n.cas.org/api/oauth2/metadata we can find details about the oauth2 api");
console.log("The SSO service can be found in the 'location' header of the response while the authentication endpoint can be found in the response\n");

https.get('https://scifinder-n.cas.org/api/oauth2/metadata', (resp) => {
    resp.setEncoding('utf8');
    console.log("location %s", resp.headers['location']);
    // A chunk of data has been received.
    resp.on('data', function (body) {
        console.log(body);
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
