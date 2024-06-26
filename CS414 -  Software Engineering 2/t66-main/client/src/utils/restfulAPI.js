import Ajv from 'ajv';
import * as configSchema from '../../schemas/ConfigResponse';
import { LOG } from './constants';
import * as userSchema from '../../schemas/UserResponse.json';
import * as loginSchema from '../../schemas/LoginResponse.json';
import * as matchSchema from '../../schemas/MatchResponse.json';
import * as infoSchema from '../../schemas/InformationResponse.json'

const SCHEMAS = {
    config: configSchema,
    user: userSchema,
    login: loginSchema,
    match: matchSchema,
    info: infoSchema
}

export async function sendAPIRequest(requestBody, serverUrl) {
    const response = await sendRequest(requestBody, serverUrl);

    if (isRequestNotSupported(requestBody)) {
        throw new Error(`sendAPIRequest() does not have support for type: ${requestBody.requestType}. Please add the schema to 'SCHEMAS'.`);
    }
    if (isJsonResponseValid(response, SCHEMAS[requestBody.requestType])) {
        return response;
    }
    LOG.error(`Server ${requestBody.requestType} response json is invalid. Check the Server.`);
    return null;
}

export function isRequestNotSupported(requestBody){
    return (!Object.keys(SCHEMAS).includes(requestBody.requestType));
}

async function sendRequest(requestBody, serverUrl) {
    const fetchOptions = {
        method: "POST",
        body: JSON.stringify(requestBody)
    };

    try {
        const response = await fetch(`${serverUrl}/api/${requestBody.requestType}`, fetchOptions);
        if (response.ok) {
            return response.json();
        } else {
            LOG.error(`Request to server ${serverUrl} failed: ${response.status}: ${response.statusText}`);
        }

    } catch (err) {
        LOG.error(`Request to server failed : ${err}`);
    }

    return null;
}

export function getOriginalServerUrl() {
    const serverProtocol = location.protocol;
    const serverHost = location.hostname;
    const serverPort = location.port;
    const alternatePort = process.env.SERVER_PORT;
    return `${serverProtocol}\/\/${serverHost}:${(!alternatePort ? serverPort : alternatePort)}`;
}

export function isJsonResponseValid(object, schema) {
    if (object && schema) {
        const anotherJsonValidator = new Ajv();
        const validate = anotherJsonValidator.compile(schema);
        return validate(object);
    }
    LOG.error(`bad arguments - isJsonResponseValid(object: ${{object}}, schema: ${{schema}})`);
    return false;
}

