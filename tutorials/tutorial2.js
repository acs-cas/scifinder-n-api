'use strict';
const colors = require('colors');
const { Issuer } = require('openid-client');

// Tutorial 2
console.log("Introduction to the CAS SSO Service\n".bold);
console.log("Now we have the location of the CAS Secure Sign-On Service from tutorial 1");
console.log("We can use an openid library to interrogate the CAS authentication service for more information");
console.log("Note: There are many openid packages that could be used for various platforms.".italic);
console.log("In these tutorials we are using the openid-client package for simplicity.".italic)


console.log("Here we use the discover command to interrogate the published .well-known endpoints for the CAS authentication service");
console.log("It will call the CAS SSO Service that returns meta data including published authentication endpoints");
console.log("The openid client encapsulates the various endpoints in the returned object (casIssuer) for us.");
console.log("You may have to do this manually with different libraries.")
Issuer.discover('https://sso.cas.org')
      .then(function (casIssuer) {
                        console.log('Discovered issuer %s\n%O', casIssuer.issuer, casIssuer.metadata);
      });
