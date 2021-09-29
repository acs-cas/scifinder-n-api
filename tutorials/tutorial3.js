'use strict';
const { Issuer,
        generators } = require('openid-client');
const http = require('http');
const url = require('url');
const colors = require('colors');


const port = 3000;

// Tutorial 3

console.log("Authenticating with the CAS SSO Service\n".bold);
console.log("The Authorization Code flow is for obtaining Access Tokens (and optionally Refresh Tokens)");
console.log("to use with the API securely as well as Refresh Tokens.\n");
console.log("Please ensure you have set your ".bold, "localServer and client ID", " in the code.\n".bold)

const ssoServer = "https://sso.cas.org";
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

            // Retrieve user info and display it as JSON
            let userinfo = await client.userinfo(tokenSet.access_token);
            response.writeHead(200, {"Content-Type": "application/json"});
            let json = JSON.stringify(userinfo);
            response.end(json);
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
