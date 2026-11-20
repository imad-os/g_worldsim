/**
 * The quick action wheel: hold its button, point the left stick at an action, let go (imad 2026-11-20). With the
 * remote (or a short press on the controller) it stays open: arrows go round it, OK does the action, Back closes.
 * The DOM is built when it opens; while open only the chosen slot's class changes (nothing is allocated per frame).
 */
export interface WheelItem { id: string; label: string; icon: string }

export class Wheel {
  open = false;
  /** True while the button is held (let go = do the chosen action). */
  hold = false;
  sel = -1;
  openedAt = 0;
  private items: WheelItem[] = [];
  private slots: HTMLElement[] = [];
  private mid: HTMLElement;
  private helpEl: HTMLElement;

  constructor(private el: HTMLElement) {
    el.hidden = true;
    this.mid = document.createElement('div'); this.mid.className = 'wh-mid';
    this.helpEl = document.createElement('div'); this.helpEl.className = 'wh-help';
  }

  show(items: WheelItem[], hold: boolean, help: string): void {
    this.items = items; this.hold = hold; this.open = true; this.sel = -1; this.openedAt = performance.now();
    this.el.textContent = '';
    this.slots = items.map((it, k) => {
      const a = (k / items.length) * Math.PI * 2; // 0 = top, clockwise
      const s = document.createElement('div');
      s.className = 'wh-s';
      s.style.left = `${50 + Math.sin(a) * 36}%`; s.style.top = `${50 - Math.cos(a) * 36}%`;
      const i = document.createElement('b'); i.textContent = it.icon;
      const l = document.createElement('span'); l.textContent = it.label;
      s.append(i, l);
      this.el.appendChild(s);
      return s;
    });
    this.mid.textContent = '';
    this.helpEl.textContent = help;
    this.el.append(this.mid, this.helpEl);
    this.el.hidden = false;
  }

  /** The stick (x right, y down): pointing far enough picks the slot in that direction. */
  aim(x: number, y: number): void {
    if (x * x + y * y < 0.3) return;
    const n = this.items.length;
    let a = Math.atan2(x, -y); if (a < 0) a += Math.PI * 2;
    this.choose(Math.round(a / ((Math.PI * 2) / n)) % n);
  }

  /** Arrows: up = the top slot, down = the bottom one, left / right go round. */
  step(d: 'left' | 'right' | 'up' | 'down'): void {
    const n = this.items.length;
    if (d === 'up') this.choose(0);
    else if (d === 'down') this.choose(Math.floor(n / 2));
    else this.choose(((this.sel < 0 ? 0 : this.sel) + (d === 'right' ? 1 : n - 1)) % n);
  }

  choose(k: number): void {
    if (k === this.sel) return;
    if (this.sel >= 0) this.slots[this.sel]?.classList.remove('on');
    this.sel = k;
    const s = this.slots[k];
    if (s) { s.classList.add('on'); this.mid.textContent = this.items[k]!.label; }
  }

  /** Closes it; returns the chosen action (null = none). */
  close(): string | null {
    if (!this.open) return null;
    const id = this.sel >= 0 ? this.items[this.sel]!.id : null;
    this.open = false; this.hold = false; this.sel = -1;
    this.el.hidden = true;
    return id;
  }
}
