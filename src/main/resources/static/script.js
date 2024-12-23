"use strict";

const alphaNumericCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const alphaNumericCharactersLength = alphaNumericCharacters.length;

function generateState(length) {
    let stateValue = "";
    for (let i = 0; i < length; i++) {
        stateValue += alphaNumericCharacters.charAt(Math.floor(Math.random() * alphaNumericCharactersLength));
    }

    document.getElementById("stateValue").innerHTML = stateValue;
}

function generateCodeVerifier() {
    let returnValue = "";
    let randomByteArray = new Uint8Array(32);
    window.crypto.getRandomValues(randomByteArray);

    returnValue = base64urlencode(randomByteArray);

    document.getElementById("codeVerifierValue").innerHTML = returnValue;
}

function base64urlencode(sourceValue) {
    let stringValue = String.fromCharCode.apply(null, sourceValue);
    let base64Encoded = btoa(stringValue);
    let base64urlEncoded = base64Encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return base64urlEncoded;
}

async function generateCodeChallenge() {
    let codeChallengeValue = "";
    let codeVerifier = document.getElementById("codeVerifierValue").innerHTML;

    if(!codeVerifier) {
        alert("Please generate Code Verifier first");
        return;
    }

    const textEncoder = new TextEncoder('US-ASCII');
    const encodedValue = textEncoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", encodedValue);

    codeChallengeValue = base64urlencode(Array.from(new Uint8Array(digest)));

    document.getElementById("codeChallengeValue").innerHTML = codeChallengeValue;
}

function getAuthCode() {
    const state = document.getElementById("stateValue").innerHTML;
    const codeChallenge = document.getElementById("codeChallengeValue").innerHTML;

    var authorizationURL = "http://localhost:8080/realms/appsdeveloperblog/protocol/openid-connect/auth";
    authorizationURL += "?client_id=photo-app-PKCE-client";
    authorizationURL += "&response_type=code";
    authorizationURL += "&scope=openid";
    authorizationURL += "&redirect_uri=http://localhost:8181/authcodeReader.html";
    authorizationURL += "&state=" + state;
    authorizationURL += "&code_challenge=" + codeChallenge;
    authorizationURL += "&code_challenge_method=S256";

    window.open(authorizationURL, 'authorizationRequestWindow', 'width=800,height=600,left=200,top=200');
}

function postAuthorize(state, authCode) {
    const originalStateValue = document.getElementById("stateValue").innerHTML;

    if(state === originalStateValue) {
        requestTokens(authCode);
    }
    else {
        alert("Invalid state received");
    }
}

function requestTokens(authCode) {
    var codeVerifier = document.getElementById("codeVerifierValue").innerHTML;
    var data = {
        "grant_type": "authorization_code",
        "client_id": "photo-app-PKCE-client",
        "code": authCode,
        "code_verifier": codeVerifier,
        "redirect_uri":"http://localhost:8181/authcodeReader.html"
    };

    $.ajax({
        beforeSend: function (request) {
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
        },
        type: "POST",
        url: "http://localhost:8080/realms/appsdeveloperblog/protocol/openid-connect/token",
        data: data,
        success: postRequestAccessToken,
        dataType: "json"
    });
}

function postRequestAccessToken(data, status, jqXHR) {
    console.log('data', data);
    document.getElementById("accessToken").innerHTML = data["access_token"];
}