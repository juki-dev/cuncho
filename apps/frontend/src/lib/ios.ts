/** Safari en iPhone/iPad sin instalar: iOS no tiene prompt de instalación. */
export function debeMostrarPistaIOS(nav: Navigator = navigator, win: Window = window): boolean {
  const ua = nav.userAgent
  const esIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && nav.maxTouchPoints > 1)
  const esSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  const instalada =
    (nav as Navigator & { standalone?: boolean }).standalone === true ||
    win.matchMedia?.('(display-mode: standalone)').matches === true
  return esIOS && esSafari && !instalada
}
