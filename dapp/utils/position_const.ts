// this util is for astro files to pass positional values of their elements

const positionState: { pos: DOMRect | undefined } = {
    pos: undefined,
  };
  
export function getPos(): DOMRect | undefined {
    return positionState.pos;
};
  
export function setPos(data: DOMRect): void {
    positionState.pos = data;
};