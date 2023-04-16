import { renderToText, replaceNodesMatching } from "$sb/lib/tree.ts";
export const queryRegex = /(<!--\s*#query\s+(.+?)-->)(.+?)(<!--\s*\/query\s*-->)/gs;
export const directiveStartRegex = /<!--\s*#([\w\-]+)\s+(.+?)-->/s;
export const directiveEndRegex = /<!--\s*\/([\w\-]+)\s*-->/s;
export function applyQuery(parsedQuery, records) {
  let resultRecords = [];
  if (parsedQuery.filter.length === 0) {
    resultRecords = records.slice();
  } else {
    recordLoop:
      for (const record of records) {
        const recordAny = record;
        for (const { op, prop, value } of parsedQuery.filter) {
          switch (op) {
            case "=": {
              const recordPropVal = recordAny[prop];
              if (Array.isArray(recordPropVal) && !Array.isArray(value)) {
                if (!recordPropVal.includes(value)) {
                  continue recordLoop;
                }
              } else if (Array.isArray(recordPropVal) && Array.isArray(value)) {
                if (!recordPropVal.some((v) => value.includes(v))) {
                  continue recordLoop;
                }
              } else if (!(recordPropVal == value)) {
                continue recordLoop;
              }
              break;
            }
            case "!=":
              if (!(recordAny[prop] != value)) {
                continue recordLoop;
              }
              break;
            case "<":
              if (!(recordAny[prop] < value)) {
                continue recordLoop;
              }
              break;
            case "<=":
              if (!(recordAny[prop] <= value)) {
                continue recordLoop;
              }
              break;
            case ">":
              if (!(recordAny[prop] > value)) {
                continue recordLoop;
              }
              break;
            case ">=":
              if (!(recordAny[prop] >= value)) {
                continue recordLoop;
              }
              break;
            case "=~":
              if (!new RegExp(value).exec(recordAny[prop])) {
                continue recordLoop;
              }
              break;
            case "!=~":
              if (new RegExp(value).exec(recordAny[prop])) {
                continue recordLoop;
              }
              break;
            case "in":
              if (!value.includes(recordAny[prop])) {
                continue recordLoop;
              }
              break;
          }
        }
        resultRecords.push(recordAny);
      }
  }
  if (parsedQuery.orderBy) {
    resultRecords = resultRecords.sort((a, b) => {
      const orderBy = parsedQuery.orderBy;
      const orderDesc = parsedQuery.orderDesc;
      if (a[orderBy] === b[orderBy]) {
        return 0;
      }
      if (a[orderBy] < b[orderBy]) {
        return orderDesc ? 1 : -1;
      } else {
        return orderDesc ? -1 : 1;
      }
    });
  }
  if (parsedQuery.limit) {
    resultRecords = resultRecords.slice(0, parsedQuery.limit);
  }
  if (parsedQuery.select) {
    resultRecords = resultRecords.map((rec) => {
      const newRec = {};
      for (const k of parsedQuery.select) {
        newRec[k] = rec[k];
      }
      return newRec;
    });
  }
  return resultRecords;
}
export function removeQueries(pt) {
  replaceNodesMatching(pt, (t) => {
    if (t.type !== "Directive") {
      return;
    }
    const renderedText = renderToText(t);
    return {
      from: t.from,
      to: t.to,
      text: new Array(renderedText.length + 1).join(" ")
    };
  });
}
