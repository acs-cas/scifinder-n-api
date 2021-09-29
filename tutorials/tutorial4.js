'use strict';
const { Issuer,
        generators } = require('openid-client');
const http = require('http');
const https = require('https');
const url = require('url');
const colors = require('colors');

const port = 3000;

// Tutorial 3

console.log("Calling the API service\n".bold);
console.log("After authentication, the token can be used for calling the API\n");
console.log("Please ensure you have set your ".bold, "localServer and client ID", " in the code.\n".bold)

const ssoServer = "https://sso.cas.org";
const apiServer = "scifinder-n.cas.org";
const clientId = "";

// Local server is the address this code is running on
const localServer = "http://localhost";

// The OAuth2 PKCE verification process uses a client side code verifier to generate
const code_verifier = generators.codeVerifier();
const code_challenge = generators.codeChallenge(code_verifier);

const requestHandler = async (request, response) => {
    console.log("First we will use the discover method to populate an object with the endpoint meta data");
    try {
        const casIssuer = await Issuer.discover(ssoServer);

        console.log("Next we create a client. You will need to provide your CAS issued client id, and client redirect uri\n");
        const client = new casIssuer.Client({
                                        client_id: clientId,
                                        redirect_uris: [localServer + ':' + port + '/' ],
                                        response_types: ['code'],
                                        token_endpoint_auth_method: 'none'
                                    }); // => Client

        const myUrl = url.parse(request.url);
        const searchParams = new URLSearchParams(myUrl.query);
        const code = searchParams.get('code');

        if (code !== null){
            console.log("code returned %s", code);
            // Exchange code with access token and refresh token
            const grant = {
                grant_type: 'authorization_code',
                code: code,
                code_verifier: code_verifier,
                redirect_uri: localServer + ':' + port + '/'
            }

            let tokenSet = await client.grant(grant)
            console.log('received and validated tokens %j', tokenSet);
            console.log('validated ID Token claims %j', tokenSet.claims());

            // Perform a search for substances with text 'water'
            const data = JSON.stringify({
                    text: 'water'
            });

            const options = {
                hostname: apiServer,
                port: 443,
                path: '/api/v1/substances',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${tokenSet.access_token}`
                }
            }

            const apiReq = https.request(options, apiRes => {
                                        console.log(`Status: ${apiRes.statusCode} ${apiRes.statusMessage}`);

                                        apiRes.on('data', d => {
                                                // Display the response from the api request in the browser
                                                response.writeHead(200);
                                                response.end(d);
                                        });
                                    });

            apiReq.on('error', error => {
                                response.writeHead(500);
                                response.end(error);
                                console.log(error);
                            });

            apiReq.write(data);
            apiReq.end();
        } else {
            console.log("When you want to have your end-users authorize you need to send them to the CAS SSO's authorization_endpoint");
            console.log("as defined in the metadata from tutorial 1 or 2.");
            const authorizationUrl = client.authorizationUrl({
                                                        scope: 'sfn-search openid',
                                                        code_challenge,
                                                        code_challenge_method: 'S256',
                                                    });

            // redirect to the authentication url
            response.writeHead(302, {
                        'Location': authorizationUrl,
            });
            response.end();
        }
    }
    catch (err) {
        console.log(err);
        response.end();
    }
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server ${localServer} is listening on ${port}. Please open a browser.`)
})

