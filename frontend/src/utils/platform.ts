// Визначає, чи користувач на Mac (для правильного показу модифікаторної клавіші
// у підказках клавіатурних скорочень). На Mac це ⌘ (Command), на інших — Ctrl.
// navigator.platform офіційно deprecated, але для цієї перевірки надійний.

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform || "";
  const ua = navigator.userAgent || "";
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac/i.test(ua);
}

/** Символ модифікатора для поточної ОС. `mod` = ⌘ на Mac, Ctrl в інших місцях. */
export const MOD_KEY: string = isMac() ? "⌘" : "Ctrl";
