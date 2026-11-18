import { Component, useEffect, type ReactNode } from 'react';
import { heroArtwork } from './heroArtwork';
import { cloverMarkup } from './cloverMarkup';
import { startCloverRuntime } from './cloverRuntime';
import './cloverCompanion.css';

// Optional decoration must never take down the page when rendering fails.
export class CloverBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  componentDidCatch(error: Error) {
    console.error('Mascot companion unavailable', error);
    document.querySelector<HTMLElement>('[data-clover-companion]')?.setAttribute('hidden', '');
  }
  render() { return this.state.failed ? null : this.props.children; }
}

// Keep the host outside routed pages so position, mood and hat survive navigation.
function companionHost() {
  let host = document.querySelector<HTMLElement>('[data-clover-companion]');
  if (!host) {
    host = document.createElement('div');
    host.dataset.cloverCompanion = '';
    host.innerHTML = '<div class="hero-web" data-hero-web aria-hidden="true"></div>' + cloverMarkup.replace('Pet Clover;', 'Pet your friendly neighborhood companion;').replace('<span data-clover-art></span>', '<span data-clover-art>' + heroArtwork + '</span>');
    document.body.appendChild(host);
    startCloverRuntime();
  }
  return host;
}

export default function CloverCompanion() {
  useEffect(() => {
    companionHost();

    const hit = document.querySelector<HTMLButtonElement>('[data-pet-hit]');
    if (!hit) throw new Error('Mascot interaction button is missing');
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
    return () => hit.removeEventListener('keydown', keyboardPet);
  }, []);
  return null;
}
