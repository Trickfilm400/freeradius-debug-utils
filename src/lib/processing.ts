const current_depth: Record<
  number,
  { i: number; buffer?: string[] | null; bufferName?: string }
> = {};
const mode = "content" as string;
const _DEBUG = false;

function debug_log(namespace: string, c: string) {
  if (_DEBUG) console.log(`[${namespace.toUpperCase()}] ` + c);
}
//search last indent and return this
function findLastArrayElement(n: number, count_spaces: number) {
  let currDepth = debug_replys[n];
  let i = 1;
  for (i; i <= count_spaces; i++) {
    //console.log(i, count_spaces, currDepth)
    if (!currDepth) continue;
    if (!Array.isArray(currDepth[currDepth.length - 1])) {
      currDepth.push([]);
      // @ts-expect-error error
      currDepth = currDepth[currDepth.length - 1];
    } else {
      // @ts-expect-error error
      currDepth = currDepth[currDepth.length - 1];
    }
  }
  return currDepth;
}
export interface ProcessData {
  text: string;
  details?: string[];
}
export type ProcessDataObj = (ProcessData | ProcessData[])[];
export type ProcessedLineDataRecord = Record<string, ProcessDataObj>;
const debug_replys: ProcessedLineDataRecord = {};
export function process_lines(lines: string[]): ProcessedLineDataRecord {
  lines.forEach((line) => {
    debug_log("line", line);
    const reg = /^\((?<line>\d+)\) ?(?:(?<module>.*?): )?(?<r>.*)/.exec(line);
    //console.log(reg)
    //not null if valid debug line
    if (reg !== null && reg.groups) {
      const n = reg.groups.line as unknown as number;
      if (!debug_replys[n]) {
        debug_replys[n] = [];
      }
      if (!current_depth[n]) {
        current_depth[n] = { i: 0 };
      }
      //enable deep nesting
      if (mode == "content") {
        const myString = reg.groups.r;
        debug_log("decision line", myString);
        let count_spaces = myString.length - myString.trim().length;
        count_spaces = count_spaces / 2;
        debug_log("decision spaces", count_spaces.toString());
        //if last indent minus current indent > 1: add to current indent, otherwise step back one indent
        const rightLineIndent = current_depth[n].i - count_spaces;
        // if true(-): goes left, if false(+): goes right
        const indentGoesLeft = rightLineIndent <= 0;
        //if bound to start AND last indent not at start -> line JUMPs to start ident -> check for MODULE (eap: ) string
        const ifIndentZeroAndLastIndentNotZero =
          count_spaces === 0 && current_depth[n].i !== 0;
        debug_log(
          "CONDITIONS",
          `rightLineIndent: ${rightLineIndent} (ifIndentSmallerZero: ${indentGoesLeft}); ifIndentZeroAndLastIndentNotZero: ${ifIndentZeroAndLastIndentNotZero}`,
        );
        //buffer
        //if a line with an "eap:" line was found: add it to the buffer / create a new one
        if (reg.groups.module) {
          if (!Array.isArray(current_depth[n].buffer)) {
            current_depth[n].buffer = [];
            current_depth[n].bufferName = reg.groups.module;
          }
          current_depth[n].buffer.push(reg.groups.r);
        }
        //if buffer: check if buffer has to end with a line "[eap] = ..." -> previous buffer has to end and appended into the current depth
        else if (current_depth[n].buffer) {
          const r = / *\[(?<module>\w*)\] = (?<state>.*)/;
          const moduleResult = r.exec(reg.groups.r);
          //only if buffer has ended, this is the regex which checks it
          if (moduleResult && moduleResult.groups) {
            //console.log(moduleResult);
            debug_log("TODO", "add buffer to final msg");
            //region add
            findLastArrayElement(n, count_spaces)?.push({
              text: reg.groups.r.trim(),
              details: current_depth[n].buffer,
              //todo: make this behind a flag "deepAnalyze" and check every line with it's value, but do this after the json has been generated, as it's easier?
              // module: moduleResult.groups.module,
              // state: moduleResult.groups.state
            });
            //endregion
          } else {
            //else: if buffer is not empty but no buffer ending. This occurs because a buffer is filled up by parent if before this elseif and if no module exists a buffer ending has to come
            //also dump buffer here because if was an incorrect buffer.
            //dump buffer
            current_depth[n].buffer?.forEach((line) => {
              findLastArrayElement(n, count_spaces)?.push({
                text: `${current_depth[n].bufferName}: ${line.trim()}`,
              });
            });
            //add new element
            findLastArrayElement(n, count_spaces)?.push({
              text: reg.groups.r.trim() /*i: {...current_depth[n]}*/,
            });
          }
          //clear buffer
          current_depth[n].buffer = null;
        }
        //////
        //////
        //////
        else if (rightLineIndent != 0) {
          //search last indent
          findLastArrayElement(n, count_spaces)?.push({
            text: reg.groups.r.trim() /*i: {...current_depth[n]}*/,
          });
        } else {
          // go here if no indent was found, just some regular message
          debug_replys[n].push({
            text: reg.groups.r /*depth : current_depth[n]*/,
          });
          current_depth[n].i = 0;
        }

        //debug_replys[n].push(reg.groups.r)
      }

      // console.log(reg)
      //console.log();
    }
  });
  return debug_replys;
}
