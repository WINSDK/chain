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

const pubKeyState: { pk: string | undefined} = {
    pk: undefined,
}

export function getPubKey(): string | undefined {
    return pubKeyState.pk;
};
  
export function setPubKey(data: string): void {
    pubKeyState.pk = data;
};