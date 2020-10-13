"use strict";

import {send as notify} from './notification';
import * as utils from "./utils";
import {i18n} from "./i18n";

let instances = {};
let successFunctions = {};
let failureFunctions = {};
let initStarted = {};

// "module.exports = class JSONLD" doesn't work with rollup because of above "import"
export default class JSONLD {
    constructor(baseApiUrl, entities) {
        this.entities = entities;
        this.baseApiUrl = baseApiUrl;

        let idToEntityNameMatchList = {};
        for (const entityName in entities) {
            const id = entities[entityName]["@id"];
            idToEntityNameMatchList[id] = entityName;
        }

        this.idToEntityNameMatchList = idToEntityNameMatchList;
    }

    static initialize(apiUrl, successFnc, failureFnc, lang = 'de') {
        if (lang !== 'de') {
            i18n.changeLanguage(lang);
        }

        // if init api call was already successfully finished execute the success function
        if (instances[apiUrl] !== undefined) {
            if (typeof successFnc == 'function') successFnc(instances[apiUrl]);

            return;
        }

        // init the arrays
        if (successFunctions[apiUrl] === undefined) successFunctions[apiUrl] = [];
        if (failureFunctions[apiUrl] === undefined) failureFunctions[apiUrl] = [];

        // add success and failure functions
        if (typeof successFnc == 'function') successFunctions[apiUrl].push(successFnc);
        if (typeof failureFnc == 'function') failureFunctions[apiUrl].push(failureFnc);

        // check if api call was already started
        if (initStarted[apiUrl] !== undefined) {
            return;
        }

        initStarted[apiUrl] = true;

        if (window.DBPAuthToken !== undefined) {
            JSONLD.doInitialization(apiUrl);
        } else {
            // window.DBPAuthToken will be set by dbp-auth-init event
            window.addEventListener("dbp-auth-init", () => JSONLD.doInitialization(apiUrl));
        }
    }

    static doInitialization(apiUrl) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", apiUrl, true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + window.DBPAuthToken);

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }

            if (xhr.status === 200) {
                const json = JSON.parse(xhr.responseText);

                let entryPoints = {};
                for (let property in json) {
                    // for some reason the properties start with a lower case character
                    if (!property.startsWith("@")) entryPoints[property.toLowerCase()] = json[property];
                }

                // read the link header of the api response
                //                const utils = require("./utils");
                const links = utils.parseLinkHeader(this.getResponseHeader("link"));

                // get the hydra apiDocumentation url
                const apiDocUrl = links["http://www.w3.org/ns/hydra/core#apiDocumentation"];

                if (apiDocUrl !== undefined) {
                    // load the hydra apiDocumentation
                    const docXhr = new XMLHttpRequest();
                    docXhr.open("GET", apiDocUrl, true);
                    docXhr.setRequestHeader("Content-Type", "application/json");
                    docXhr.onreadystatechange = function () {
                        if (docXhr.readyState !== 4) {
                            return;
                        }

                        if (docXhr.status === 200) {
                            JSONLD.gatherEntities(docXhr, apiUrl, entryPoints);
                        } else {
                            JSONLD.executeFailureFunctions(apiUrl, i18n.t('jsonld.api-documentation-server', {apiUrl: apiDocUrl}));
                        }
                    };

                    docXhr.send();
                } else {
                    JSONLD.executeFailureFunctions(apiUrl, i18n.t('jsonld.error-hydra-documentation-url-not-set', {apiUrl: apiUrl}));
                }
            } else {
                JSONLD.executeFailureFunctions(apiUrl, i18n.t('jsonld.error-api-server', {apiUrl: apiUrl}));
            }
        };

        xhr.send();
    }

    /**
     * Gather the entities
     *
     * @param docXhr
     * @param apiUrl
     * @param entryPoints
     */
    static gatherEntities(docXhr, apiUrl, entryPoints) {
        const json = JSON.parse(docXhr.responseText);
        const supportedClasses = json["hydra:supportedClass"];

        let entities = {};
        const baseUrl = utils.parseBaseUrl(apiUrl);

        // gather the entities
        supportedClasses.forEach(function (classData) {
            // add entry point url
            const entityName = classData["hydra:title"];
            let entryPoint = entryPoints[entityName.toLowerCase()];
            if (entryPoint !== undefined && !entryPoint.startsWith("http")) entryPoint = baseUrl + entryPoint;
            classData["@entryPoint"] = entryPoint;

            entities[entityName] = classData;
        });

        const instance = new JSONLD(baseUrl, entities);
        instances[apiUrl] = instance;

        // return the initialized JSONLD object
        for (const fnc of successFunctions[apiUrl]) if (typeof fnc == 'function') fnc(instance);
        successFunctions[apiUrl] = [];
    }

    /**
     * Execute failure functions and send general notification
     *
     * @param apiUrl
     * @param message
     */
    static executeFailureFunctions(apiUrl, message = "") {
        for (const fnc of failureFunctions[apiUrl]) if (typeof fnc == 'function') fnc();
        failureFunctions[apiUrl] = [];

        if (message !== "") {
            notify({
                "summary": i18n.t('error.summary'),
                "body": message,
                "type": "danger",
            });
        }
    }

    static getInstance(apiUrl) {
        return instances[apiUrl];
    }

    getEntityForIdentifier(identifier) {
        let entityName = this.getEntityNameForIdentifier(identifier);
        return this.getEntityForEntityName(entityName);
    }

    getEntityForEntityName(entityName) {
        return this.entities[entityName];
    }

    getApiUrlForIdentifier(identifier) {
        const entity = this.getEntityForIdentifier(identifier);

        if (entity === undefined || entity["@entryPoint"] === undefined) {
            throw new Error(`Entity with identifier "${identifier}" not found!`);
        }

        return entity["@entryPoint"];
    }

    getApiUrlForEntityName(entityName) {
        const entity = this.getEntityForEntityName(entityName);

        if (entity === undefined || entity["@entryPoint"] === undefined) {
            throw new Error(`Entity "${entityName}" not found!`);
        }

        return entity["@entryPoint"];
    }

    getEntityNameForIdentifier(identifier) {
        return this.idToEntityNameMatchList[identifier];
    }

    getApiIdentifierList() {
        let keys = [];
        for (const property in this.idToEntityNameMatchList) {
            keys.push(property);
        }

        return keys;
    }

    /**
     * Expands a member of a list to a object with schema.org properties
     *
     * @param member
     * @param [context]
     */
    expandMember(member, context) {
        if (context === undefined) {
            context = member["@context"];
        }

        let result = {"@id": member["@id"]};
        for (const key of Object.keys(context)) {
            const value = context[key];
            if (member[key] !== undefined)
                result[value] = member[key];
        }

        return result;
    }

    /**
     * Compacts an expanded member of a list to a object with local properties
     *
     * @param member
     * @param localContext
     */
    compactMember(member, localContext) {
        let result = {};

        for (const property in localContext) {
            const value = member[localContext[property]];

            if (value !== undefined) {
                result[property] = value;
            }
        }

        return result;
    }

    /**
     * Transforms hydra members to a local context
     *
     * @param data
     * @param localContext
     * @returns {Array} An array of transformed objects
     */
    transformMembers(data, localContext) {
        const members = data['hydra:member'];

        if (members === undefined || members.length === 0) {
            return [];
        }

        const otherContext = data['@context'];
        let results = [];
        let that = this;

        members.forEach(function (member) {
            results.push(that.compactMember(that.expandMember(member, otherContext), localContext));
        });

        return results;
    }
}
