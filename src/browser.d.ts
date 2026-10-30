interface Window {
  webkitAudioContext?: typeof AudioContext;
}

interface Document {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
}

interface HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}
