import { googleauth } from "./google-auth.proto.js";
import toBase32 from 'base32-encode';

function uint8ArrayToBase32(uint8Array) {
    const base32String = toBase32(uint8Array, 'Crockford');
    return base32String;
}

function base64ToUint8Array(base64String) {
    const d = atob(base64String);
    const n = d.length;
    const res = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        res[i] = d.charCodeAt(i);
    }
    return res;
}

function decodeOTPAuthMigration(uri) {
    let prefix = "otpauth-migration://offline?data=";
    //let prefix = "otpauth-migration:";
    if (!uri.startsWith(prefix)) {
        return null; // Invalid URI
    }

    const dataPart = decodeURIComponent(uri.slice(prefix.length));
    //console.log("dataPart:", dataPart);
    //const payload = Buffer.from(dataPart, "base64");
    const payload = base64ToUint8Array(dataPart);
    //console.log(b);
    const message = googleauth.MigrationPayload.decode(payload);
    const o = googleauth.MigrationPayload.toObject(message);
    //console.log(o);
    return o;
}
