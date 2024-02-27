/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

const $Reader = $protobuf.Reader, $util = $protobuf.util;

const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const googleauth = $root.googleauth = (() => {

    const googleauth = {};

    googleauth.MigrationPayload = (function() {

        function MigrationPayload(properties) {
            this.otpParameters = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        MigrationPayload.prototype.otpParameters = $util.emptyArray;
        MigrationPayload.prototype.version = 0;
        MigrationPayload.prototype.batchSize = 0;
        MigrationPayload.prototype.batchIndex = 0;
        MigrationPayload.prototype.batchId = 0;

        MigrationPayload.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.googleauth.MigrationPayload();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.otpParameters && message.otpParameters.length))
                            message.otpParameters = [];
                        message.otpParameters.push($root.googleauth.MigrationPayload.OtpParameters.decode(reader, reader.uint32()));
                        break;
                    }
                case 2: {
                        message.version = reader.int32();
                        break;
                    }
                case 3: {
                        message.batchSize = reader.int32();
                        break;
                    }
                case 4: {
                        message.batchIndex = reader.int32();
                        break;
                    }
                case 5: {
                        message.batchId = reader.int32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        MigrationPayload.fromObject = function fromObject(object) {
            if (object instanceof $root.googleauth.MigrationPayload)
                return object;
            let message = new $root.googleauth.MigrationPayload();
            if (object.otpParameters) {
                if (!Array.isArray(object.otpParameters))
                    throw TypeError(".googleauth.MigrationPayload.otpParameters: array expected");
                message.otpParameters = [];
                for (let i = 0; i < object.otpParameters.length; ++i) {
                    if (typeof object.otpParameters[i] !== "object")
                        throw TypeError(".googleauth.MigrationPayload.otpParameters: object expected");
                    message.otpParameters[i] = $root.googleauth.MigrationPayload.OtpParameters.fromObject(object.otpParameters[i]);
                }
            }
            if (object.version != null)
                message.version = object.version | 0;
            if (object.batchSize != null)
                message.batchSize = object.batchSize | 0;
            if (object.batchIndex != null)
                message.batchIndex = object.batchIndex | 0;
            if (object.batchId != null)
                message.batchId = object.batchId | 0;
            return message;
        };

        MigrationPayload.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.otpParameters = [];
            if (options.defaults) {
                object.version = 0;
                object.batchSize = 0;
                object.batchIndex = 0;
                object.batchId = 0;
            }
            if (message.otpParameters && message.otpParameters.length) {
                object.otpParameters = [];
                for (let j = 0; j < message.otpParameters.length; ++j)
                    object.otpParameters[j] = $root.googleauth.MigrationPayload.OtpParameters.toObject(message.otpParameters[j], options);
            }
            if (message.version != null && message.hasOwnProperty("version"))
                object.version = message.version;
            if (message.batchSize != null && message.hasOwnProperty("batchSize"))
                object.batchSize = message.batchSize;
            if (message.batchIndex != null && message.hasOwnProperty("batchIndex"))
                object.batchIndex = message.batchIndex;
            if (message.batchId != null && message.hasOwnProperty("batchId"))
                object.batchId = message.batchId;
            return object;
        };

        MigrationPayload.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        MigrationPayload.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/googleauth.MigrationPayload";
        };

        MigrationPayload.Algorithm = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "ALGORITHM_UNSPECIFIED"] = 0;
            values[valuesById[1] = "ALGORITHM_SHA1"] = 1;
            values[valuesById[2] = "ALGORITHM_SHA256"] = 2;
            values[valuesById[3] = "ALGORITHM_SHA512"] = 3;
            values[valuesById[4] = "ALGORITHM_MD5"] = 4;
            return values;
        })();

        MigrationPayload.DigitCount = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "DIGIT_COUNT_UNSPECIFIED"] = 0;
            values[valuesById[1] = "DIGIT_COUNT_SIX"] = 1;
            values[valuesById[2] = "DIGIT_COUNT_EIGHT"] = 2;
            return values;
        })();

        MigrationPayload.OtpType = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "OTP_TYPE_UNSPECIFIED"] = 0;
            values[valuesById[1] = "OTP_TYPE_HOTP"] = 1;
            values[valuesById[2] = "OTP_TYPE_TOTP"] = 2;
            return values;
        })();

        MigrationPayload.OtpParameters = (function() {

            function OtpParameters(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            OtpParameters.prototype.secret = $util.newBuffer([]);
            OtpParameters.prototype.name = "";
            OtpParameters.prototype.issuer = "";
            OtpParameters.prototype.algorithm = 0;
            OtpParameters.prototype.digits = 0;
            OtpParameters.prototype.type = 0;
            OtpParameters.prototype.counter = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            OtpParameters.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.googleauth.MigrationPayload.OtpParameters();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1: {
                            message.secret = reader.bytes();
                            break;
                        }
                    case 2: {
                            message.name = reader.string();
                            break;
                        }
                    case 3: {
                            message.issuer = reader.string();
                            break;
                        }
                    case 4: {
                            message.algorithm = reader.int32();
                            break;
                        }
                    case 5: {
                            message.digits = reader.int32();
                            break;
                        }
                    case 6: {
                            message.type = reader.int32();
                            break;
                        }
                    case 7: {
                            message.counter = reader.int64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            OtpParameters.fromObject = function fromObject(object) {
                if (object instanceof $root.googleauth.MigrationPayload.OtpParameters)
                    return object;
                let message = new $root.googleauth.MigrationPayload.OtpParameters();
                if (object.secret != null)
                    if (typeof object.secret === "string")
                        $util.base64.decode(object.secret, message.secret = $util.newBuffer($util.base64.length(object.secret)), 0);
                    else if (object.secret.length >= 0)
                        message.secret = object.secret;
                if (object.name != null)
                    message.name = String(object.name);
                if (object.issuer != null)
                    message.issuer = String(object.issuer);
                switch (object.algorithm) {
                default:
                    if (typeof object.algorithm === "number") {
                        message.algorithm = object.algorithm;
                        break;
                    }
                    break;
                case "ALGORITHM_UNSPECIFIED":
                case 0:
                    message.algorithm = 0;
                    break;
                case "ALGORITHM_SHA1":
                case 1:
                    message.algorithm = 1;
                    break;
                case "ALGORITHM_SHA256":
                case 2:
                    message.algorithm = 2;
                    break;
                case "ALGORITHM_SHA512":
                case 3:
                    message.algorithm = 3;
                    break;
                case "ALGORITHM_MD5":
                case 4:
                    message.algorithm = 4;
                    break;
                }
                switch (object.digits) {
                default:
                    if (typeof object.digits === "number") {
                        message.digits = object.digits;
                        break;
                    }
                    break;
                case "DIGIT_COUNT_UNSPECIFIED":
                case 0:
                    message.digits = 0;
                    break;
                case "DIGIT_COUNT_SIX":
                case 1:
                    message.digits = 1;
                    break;
                case "DIGIT_COUNT_EIGHT":
                case 2:
                    message.digits = 2;
                    break;
                }
                switch (object.type) {
                default:
                    if (typeof object.type === "number") {
                        message.type = object.type;
                        break;
                    }
                    break;
                case "OTP_TYPE_UNSPECIFIED":
                case 0:
                    message.type = 0;
                    break;
                case "OTP_TYPE_HOTP":
                case 1:
                    message.type = 1;
                    break;
                case "OTP_TYPE_TOTP":
                case 2:
                    message.type = 2;
                    break;
                }
                if (object.counter != null)
                    if ($util.Long)
                        (message.counter = $util.Long.fromValue(object.counter)).unsigned = false;
                    else if (typeof object.counter === "string")
                        message.counter = parseInt(object.counter, 10);
                    else if (typeof object.counter === "number")
                        message.counter = object.counter;
                    else if (typeof object.counter === "object")
                        message.counter = new $util.LongBits(object.counter.low >>> 0, object.counter.high >>> 0).toNumber();
                return message;
            };

            OtpParameters.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    if (options.bytes === String)
                        object.secret = "";
                    else {
                        object.secret = [];
                        if (options.bytes !== Array)
                            object.secret = $util.newBuffer(object.secret);
                    }
                    object.name = "";
                    object.issuer = "";
                    object.algorithm = options.enums === String ? "ALGORITHM_UNSPECIFIED" : 0;
                    object.digits = options.enums === String ? "DIGIT_COUNT_UNSPECIFIED" : 0;
                    object.type = options.enums === String ? "OTP_TYPE_UNSPECIFIED" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.counter = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.counter = options.longs === String ? "0" : 0;
                }
                if (message.secret != null && message.hasOwnProperty("secret"))
                    object.secret = options.bytes === String ? $util.base64.encode(message.secret, 0, message.secret.length) : options.bytes === Array ? Array.prototype.slice.call(message.secret) : message.secret;
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.issuer != null && message.hasOwnProperty("issuer"))
                    object.issuer = message.issuer;
                if (message.algorithm != null && message.hasOwnProperty("algorithm"))
                    object.algorithm = options.enums === String ? $root.googleauth.MigrationPayload.Algorithm[message.algorithm] === undefined ? message.algorithm : $root.googleauth.MigrationPayload.Algorithm[message.algorithm] : message.algorithm;
                if (message.digits != null && message.hasOwnProperty("digits"))
                    object.digits = options.enums === String ? $root.googleauth.MigrationPayload.DigitCount[message.digits] === undefined ? message.digits : $root.googleauth.MigrationPayload.DigitCount[message.digits] : message.digits;
                if (message.type != null && message.hasOwnProperty("type"))
                    object.type = options.enums === String ? $root.googleauth.MigrationPayload.OtpType[message.type] === undefined ? message.type : $root.googleauth.MigrationPayload.OtpType[message.type] : message.type;
                if (message.counter != null && message.hasOwnProperty("counter"))
                    if (typeof message.counter === "number")
                        object.counter = options.longs === String ? String(message.counter) : message.counter;
                    else
                        object.counter = options.longs === String ? $util.Long.prototype.toString.call(message.counter) : options.longs === Number ? new $util.LongBits(message.counter.low >>> 0, message.counter.high >>> 0).toNumber() : message.counter;
                return object;
            };

            OtpParameters.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            OtpParameters.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/googleauth.MigrationPayload.OtpParameters";
            };

            return OtpParameters;
        })();

        return MigrationPayload;
    })();

    return googleauth;
})();

export { $root as default };
