import * as Dockerode from "dockerode";
import { ProcessedLineDataRecord } from "../lib/processing";
import { AbstractData } from "../lib/abstractData";

export interface ISocketServerToClientEvents {
  containerList: (data: Dockerode.ContainerInfo[]) => void;
  logStream: (data: string[]) => void;
  logProcessing: (data: ProcessedLineDataRecord) => void;
  logProcessingAbstract: (id: string, data: AbstractData) => void;
}

export interface ISocketClientToServerEvents {
  startContainer: (container: string, cb: (result: boolean) => void) => void;
  stopContainer: (container: string, cb: (result: boolean) => void) => void;
  restartContainer: (container: string, cb: (result: boolean) => void) => void;
  startTrailing: (container: string, cb: (result: boolean) => void) => void;
  //todo: implement
  getContainerList: () => void;
  //todo: add event for cleaning local cache variables
}

//eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ISocketInterServerEvents {}

//eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ISocketData {}
