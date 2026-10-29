export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback for non-secure contexts (e.g. http on a local network)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getPlayerId(): string {
  let id = localStorage.getItem('sc:playerId');
  if (!id) {
    id = uid();
    localStorage.setItem('sc:playerId', id);
  }
  return id;
}

// ?host only reveals the host buttons. It is not security.
export function initHost() {
  if (new URLSearchParams(location.search).has('host')) sessionStorage.setItem('sc:host', '1');
}
export const isHost = () => sessionStorage.getItem('sc:host') === '1';
