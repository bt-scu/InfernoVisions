// Persistence layer for board state

import type { Item } from './items';

const STORAGE_KEY = 'moodboard-state';
const STORAGE_VERSION = 1;
const ONBOARDING_KEY = 'moodboard-onboarding';

interface StoredState {
  version: number;
  items: Item[];
  savedAt: string;
}

/**
 * Save board state to localStorage
 */
export function saveBoard(items: Item[]): void {
  try {
    const state: StoredState = {
      version: STORAGE_VERSION,
      items,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save board:', error);
  }
}

/**
 * Load board state from localStorage
 */
export function loadBoard(): Item[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state: StoredState = JSON.parse(stored);

    // Version check
    if (state.version !== STORAGE_VERSION) {
      console.warn('Board version mismatch, ignoring stored state');
      return null;
    }

    // Migrate old items to include new required properties
    return state.items.map(item => ({
      ...item,
      visible: item.visible !== undefined ? item.visible : true,
      locked: item.locked !== undefined ? item.locked : false,
      opacity: item.opacity !== undefined ? item.opacity : 1,
    }));
  } catch (error) {
    console.error('Failed to load board:', error);
    return null;
  }
}

/**
 * Export board as JSON file
 */
export async function exportBoard(items: Item[]): Promise<void> {
  try {
    const state: StoredState = {
      version: STORAGE_VERSION,
      items,
      savedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(state, null, 2);

    // Create a readable filename with date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const filename = `moodboard-${dateStr}-${timeStr}.json`;

    const blob = new Blob([jsonString], {
      type: 'application/json',
    });

    // Try Web Share API first (best experience on visionOS/iOS)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const exportFile = new File([blob], filename, { type: 'application/json' });
        const shareData: ShareData = {
          files: [exportFile],
          title: 'Moodboard Export',
          text: 'Exported moodboard data',
        };

        const canShareFiles =
          typeof (navigator as any).canShare !== 'function' ||
          (navigator as any).canShare(shareData);

        if (canShareFiles) {
          await navigator.share(shareData);
          console.log(`Board exported via share sheet as ${filename}`);
          return;
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          console.log('Share cancelled by user');
          return;
        }
        console.warn('Web Share API failed, trying other export methods:', err);
      }
    }

    // Prefer File System Access API when available (desktop Chrome/Safari)
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const picker = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Moodboard JSON',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });

        const writable = await picker.createWritable();
        await writable.write(blob);
        await writable.close();

        console.log(`Board exported as ${filename}`);
        return;
      } catch (err: any) {
        // User cancelled or error occurred
        if (err.name === 'AbortError') {
          console.log('Export cancelled by user');
          return;
        }
        console.warn('File System Access API failed, falling back to download:', err);
      }
    }

    // Fallback: traditional download method
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;

    // Safari/visionOS compatibility: add to DOM before clicking
    a.style.display = 'none';
    document.body.appendChild(a);

    // Trigger with user interaction context
    a.click();

    // Clean up
    setTimeout(() => {
      if (a.parentNode) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 100);

    console.log(`Board exported as ${filename}`);
  } catch (error) {
    console.error('Failed to export board:', error);
    alert('Failed to export board. Please try again.');
  }
}

/**
 * Import board from JSON file
 */
export function importBoard(): Promise<Item[] | null> {
  return new Promise((resolve) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const state: StoredState = JSON.parse(text);

          // Validate structure
          if (!state.items || !Array.isArray(state.items)) {
            throw new Error('Invalid board file format');
          }

          resolve(state.items);
        } catch (error) {
          console.error('Failed to parse board file:', error);
          alert('Failed to import board: Invalid file format');
          resolve(null);
        }
      };

      input.click();
    } catch (error) {
      console.error('Failed to import board:', error);
      alert('Failed to import board');
      resolve(null);
    }
  });
}

/**
 * Clear stored board
 */
export function clearBoard(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear board:', error);
  }
}

// ===== Onboarding State =====

interface OnboardingState {
  hasSeenWelcome: boolean;
  dismissedAt?: string;
}

/**
 * Get onboarding state from localStorage
 */
export function getOnboardingState(): OnboardingState {
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (!stored) {
      return { hasSeenWelcome: false };
    }
    return JSON.parse(stored) as OnboardingState;
  } catch (error) {
    console.error('Failed to get onboarding state:', error);
    return { hasSeenWelcome: false };
  }
}

/**
 * Mark onboarding as dismissed (don't show again)
 */
export function setOnboardingDismissed(): void {
  try {
    const state: OnboardingState = {
      hasSeenWelcome: true,
      dismissedAt: new Date().toISOString(),
    };
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save onboarding state:', error);
  }
}

/**
 * Reset onboarding state (for testing)
 */
export function resetOnboarding(): void {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
  }
}
