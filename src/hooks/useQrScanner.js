/** Camera / photo QR decoding (SRS FR-5). Uses BarcodeDetector when available, else jsQR. */
import { useRef, useState, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';

export default function useQrScanner(onCode, onError) {
  const videoRef = useRef(null), streamRef = useRef(null), timer = useRef(0), canvas = useRef(null);
  const cb = useRef({ onCode, onError }); cb.current = { onCode, onError };
  const [active, setActive] = useState(false);

  const decode = useCallback(async (src, w, h) => {
    if (!canvas.current) canvas.current = document.createElement('canvas');
    const cv = canvas.current, sc = Math.min(1, 900 / Math.max(w, h));
    cv.width = Math.round(w * sc); cv.height = Math.round(h * sc);
    const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(src, 0, 0, cv.width, cv.height);
    if ('BarcodeDetector' in window) { try { const r = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(cv); if (r[0]) return r[0].rawValue; } catch { /* fall back to jsQR */ } }
    const d = c.getImageData(0, 0, cv.width, cv.height);
    const code = jsQR(d.data, d.width, d.height);
    return code ? code.data : null;
  }, []);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setActive(false);
  }, []);

  const loop = useCallback(async () => {
    const v = videoRef.current; if (!streamRef.current || !v) return;
    if (v.readyState >= 2 && v.videoWidth) { const code = await decode(v, v.videoWidth, v.videoHeight); if (code) { stop(); cb.current.onCode(code); return; } }
    timer.current = setTimeout(loop, 300);
  }, [decode, stop]);

  const start = useCallback(async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const v = videoRef.current; v.srcObject = streamRef.current; await v.play(); setActive(true); loop();
    } catch { stop(); cb.current.onError('Camera is not available here. Upload a photo of the QR code instead.'); }
  }, [loop, stop]);

  const decodeFile = useCallback(file => {
    if (!file) return;
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = async () => { const code = await decode(img, img.naturalWidth, img.naturalHeight); URL.revokeObjectURL(url); code ? cb.current.onCode(code) : cb.current.onError('No QR code found in that photo. Try a clearer, closer picture.'); };
    img.onerror = () => cb.current.onError('Could not read that image.');
    img.src = url;
  }, [decode]);

  useEffect(() => stop, [stop]); // release the camera when leaving the page
  return { videoRef, active, start, stop, decodeFile };
}
