import { SorobanRpc } from "@stellar/stellar-sdk";

// this util is for astro files to pass globals and constants
const positionState: { pos: DOMRect | undefined } = {
    pos: undefined,
  };
  
export function getPos(): DOMRect | undefined {
    return positionState.pos;
};
  
export function setPos(data: DOMRect): void {
    positionState.pos = data;
};

// this util is for astro files to initialise a SorobanRpc server, and retrieve it
const serverState: { server: SorobanRpc.Server | undefined} = {
    server: undefined,
};

export function getServer(): SorobanRpc.Server | undefined {
    return serverState.server;
};

export function setServer(serverURL: string, opts?: SorobanRpc.Server.Options) {
    serverState.server = new SorobanRpc.Server(serverURL, opts);
    return serverState.server;
};

const pubKeyState: { pk: string | undefined} = {
    pk: undefined,
}

export function getPubKey(): string | undefined {
    return pubKeyState.pk;
};
  
export function setPubKey(data: string): void {
    pubKeyState.pk = data;
};