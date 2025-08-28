import { ProcessDataObj } from "./processing";

type JSONAlias = Record<string, string>;

type FileExec = {
  file: string;
  data: Record<string, JSONAlias>;
};

export interface AbstractData {
  request: { properties: JSONAlias; request: JSONAlias };
  execute: Record<string, FileExec>;
  global: { properties: JSONAlias; str: string[] };
  response: { properties: JSONAlias; response: JSONAlias; state?: string };
  challenge: { properties: JSONAlias; response: JSONAlias };
}

const REGEX_KEY_VALUE = /(?<key>.*) = "?(?<value>[^"\n\t\r]*)"?/;
const REGEX_ACCESS_REQUEST =
  /Received Access-Request Id (?<id>\d*) from (?<from>.*) to (?<to>.*) length (?<length>\d*)/;
const REGEX_EXECUTION =
  /# Executing (?:section)? ?(?<execution>.*) from file (?<file>.*)/;
const REGEX_ACCESS_ACCEPT =
  /Sent Access-Accept Id (?<id>\d*) from (?<from>.*) to (?<to>.*) length (?<length>\d*)/;
const REGEX_ACCESS_CHALLENGE =
  /Sent Access-Challenge Id (?<id>\d*) from (?<from>.*) to (?<to>.*) length (?<length>\d*)/;
const REGEX_ACCESS_REJECT =
  /Sent Access-Reject Id (?<id>\d*) from (?<from>.*) to (?<to>.*) length (?<length>\d*)/;

export function abstractData(obj: ProcessDataObj, debugLog = false) {
  const resObj = <AbstractData>{
    request: { properties: {}, request: {} },
    response: { properties: {}, response: {} },
    challenge: { properties: {}, response: {} },
    global: { str: [], properties: {} },
    execute: {},
  };
  for (let i = 0; i < obj.length; ) {
    const currElement = obj[i];
    if (debugLog) {
      console.group();
      console.group();
      console.log(currElement);
    }

    const nextElement = obj[i + 1];
    let skipNextElement = false;
    if (Array.isArray(currElement)) {
      //will be handled by the other if. this is just a placeholder for future use, if needed. Don't ask me.
    } else {
      if (
        Object.keys(resObj.request.properties).length <= 0 &&
        REGEX_ACCESS_REQUEST.test(currElement.text) /*regex here*/
      ) {
        if (debugLog) console.log("X: found request");
        const res = REGEX_ACCESS_REQUEST.exec(currElement.text);
        resObj.request.request.id = res!.groups!.id;
        resObj.request.request.from = res!.groups!.from;
        resObj.request.request.to = res!.groups!.to;
        resObj.request.request.length = res!.groups!.length;
        if (Array.isArray(nextElement)) {
          nextElement.forEach((item) => {
            const res = REGEX_KEY_VALUE.exec(item.text);
            // console.log(res)
            if (res?.groups?.key && res.groups?.value) {
              resObj.request.properties[res.groups.key] = res.groups.value;
            } else {
              //todo: what to do with failed parsing values
            }
          });
        }
        // resObj.request = nextElement as any
        skipNextElement = true;
      }
      if (
        Object.keys(resObj.response.properties).length <= 0 &&
        (REGEX_ACCESS_ACCEPT.test(currElement.text) ||
          REGEX_ACCESS_REJECT.test(currElement.text)) /*regex here*/
      ) {
        if (debugLog) console.log("X: found response");
        let res = REGEX_ACCESS_ACCEPT.exec(currElement.text);

        if (!res) {
          res = REGEX_ACCESS_REJECT.exec(currElement.text);
          resObj.response.state = "reject";
        } else resObj.response.state = "accept";
        resObj.response.response.id = res!.groups!.id;
        resObj.response.response.from = res!.groups!.from;
        resObj.response.response.to = res!.groups!.to;
        resObj.response.response.length = res!.groups!.length;
        if (Array.isArray(nextElement)) {
          nextElement.forEach((item) => {
            const res = REGEX_KEY_VALUE.exec(item.text);
            // console.log(res)
            if (res?.groups?.key && res.groups?.value) {
              resObj.response.properties[res.groups.key] = res.groups.value;
            } else {
              //todo: what to do with failed parsing values
            }
          });
        }
        skipNextElement = true;
      }
      if (
        Object.keys(resObj.challenge.properties).length <= 0 &&
        REGEX_ACCESS_CHALLENGE.test(currElement.text) /*regex here*/
      ) {
        if (debugLog) console.log("X: found response");
        const res = REGEX_ACCESS_CHALLENGE.exec(currElement.text);
        resObj.challenge.response.id = res!.groups!.id;
        resObj.challenge.response.from = res!.groups!.from;
        resObj.challenge.response.to = res!.groups!.to;
        resObj.challenge.response.length = res!.groups!.length;
        if (Array.isArray(nextElement)) {
          nextElement.forEach((item) => {
            const res = REGEX_KEY_VALUE.exec(item.text);
            // console.log(res)
            if (res?.groups?.key && res.groups?.value) {
              resObj.challenge.properties[res.groups.key] = res.groups.value;
            } else {
              //todo: what to do with failed parsing values
            }
          });
        }
        skipNextElement = true;
      }
      if (currElement.text && !Array.isArray(nextElement)) {
        //add to global
        const regex = REGEX_KEY_VALUE.exec(currElement.text);
        if (regex && regex.groups) {
          //console.log("Y:", regex)
          resObj.global.properties[regex.groups.key] = regex.groups.value;
        } else resObj.global.str.push(currElement.text);
      }
      if (REGEX_EXECUTION.test(currElement.text)) {
        const details = REGEX_EXECUTION.exec(currElement.text);
        if (details && details.groups && details.groups.execution) {
          if (!resObj.execute[details.groups.execution])
            resObj.execute[details.groups.execution] = {} as FileExec;
          resObj.execute[details.groups.execution].file = details.groups.file;
          resObj.execute[details.groups.execution].data = nextElement as never;
        }
      }
    }
    //if the next array was already processed, skip this entry
    if (skipNextElement) i += 2;
    else i++;
    if (debugLog) {
      console.groupEnd();
      console.groupEnd();
    }
  }
  return resObj;
}
