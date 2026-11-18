import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BotAvatar } from 'bot-avatars';
import { cloverMarkup } from './cloverMarkup';
import { startCloverRuntime } from './cloverRuntime';
import './cloverCompanion.css';

// Keep the host outside routed pages so position, mood and hat survive navigation.
function companionHost() {
  let host = document.querySelector<HTMLElement>('[data-clover-companion]');
  if (!host) {
    host = document.createElement('div');
    host.dataset.cloverCompanion = '';
    host.innerHTML = cloverMarkup;
    document.body.appendChild(host);
    startCloverRuntime();
  }
  return host;
}

export default function CloverCompanion() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [dizzy, setDizzy] = useState(false);
  const [blink, setBlink] = useState(false);
  const [pose, setPose] = useState({ yaw: 0, pitch: 0, roll: 0 });
  useEffect(() => {
    const host = companionHost();
    const pet = host.querySelector<HTMLElement>('[data-site-pet]')!;
    setSlot(host.querySelector<HTMLElement>('[data-clover-art]'));
    const hit = host.querySelector<HTMLButtonElement>('[data-pet-hit]')!;
    const keyboardPet = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (e.repeat) return;
      const r = hit.getBoundingClientRect();
      const init = { bubbles: true, pointerId: 1, clientX: r.left + r.width/2, clientY: r.top + r.height/2, button: 0 };
      hit.dispatchEvent(new PointerEvent('pointerdown', init));
      hit.dispatchEvent(new PointerEvent('pointerup', init));
    };
    hit.addEventListener('keydown', keyboardPet);
    const observer = new MutationObserver(() => {
      setDizzy(pet.hasAttribute('data-dizzy'));
      setBlink(pet.hasAttribute('data-blink'));
    });
    observer.observe(pet, { attributes: true, attributeFilter: ['data-dizzy', 'data-blink'] });
    let frame = 0;
    const track = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = pet.getBoundingClientRect();
        setPose({ yaw: Math.max(-0.4, Math.min(0.4, (e.clientX-r.left-32)/600)), pitch: Math.max(-0.2, Math.min(0.2, (e.clientY-r.top-36)/800)), roll: 0 });
      });
    };
    window.addEventListener('pointermove', track, {passive:true});
    return () => { observer.disconnect(); hit.removeEventListener('keydown', keyboardPet); cancelAnimationFrame(frame); window.removeEventListener('pointermove', track); };
  }, []);
  return slot && createPortal(
    <BotAvatar type="clover" size={64} shading="fabric" interactive={false}
      jumpEvery={0} jumpHeight={0} jumpSpin={0} turn={0} pose={pose}
      state={dizzy ? 'working' : blink ? 'sleeping' : 'default'} />,
    slot,
  );
}
