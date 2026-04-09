export interface AnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
}

export interface TransitionOptions extends AnimationOptions {
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function animate(
  element: HTMLElement,
  keyframes: Keyframe[],
  options: AnimationOptions = {}
): Animation {
  const {
    duration = 300,
    easing = 'ease-in-out',
    delay = 0,
  } = options;

  return element.animate(keyframes, {
    duration,
    easing,
    delay,
    fill: 'forwards',
  });
}

export function fadeIn(
  element: HTMLElement,
  options: AnimationOptions = {}
): Animation {
  return animate(
    element,
    [
      { opacity: 0 },
      { opacity: 1 }
    ],
    options
  );
}

export function fadeOut(
  element: HTMLElement,
  options: AnimationOptions = {}
): Animation {
  return animate(
    element,
    [
      { opacity: 1 },
      { opacity: 0 }
    ],
    options
  );
}

export function slideIn(
  element: HTMLElement,
  direction: 'left' | 'right' | 'top' | 'bottom' = 'right',
  options: AnimationOptions = {}
): Animation {
  const start = {
    left: { transform: 'translateX(-100%)' },
    right: { transform: 'translateX(100%)' },
    top: { transform: 'translateY(-100%)' },
    bottom: { transform: 'translateY(100%)' },
  };

  return animate(
    element,
    [
      start[direction],
      { transform: 'translate(0)' }
    ],
    options
  );
}

export function slideOut(
  element: HTMLElement,
  direction: 'left' | 'right' | 'top' | 'bottom' = 'right',
  options: AnimationOptions = {}
): Animation {
  const end = {
    left: { transform: 'translateX(-100%)' },
    right: { transform: 'translateX(100%)' },
    top: { transform: 'translateY(-100%)' },
    bottom: { transform: 'translateY(100%)' },
  };

  return animate(
    element,
    [
      { transform: 'translate(0)' },
      end[direction]
    ],
    options
  );
}

export function transition(
  element: HTMLElement,
  properties: string[],
  options: TransitionOptions = {}
): Promise<void> {
  const {
    duration = 300,
    easing = 'ease-in-out',
    delay = 0,
    onStart,
    onComplete,
    onCancel
  } = options;

  return new Promise((resolve, reject) => {
    const originalTransition = element.style.transition;
    const transitionString = properties
      .map(prop => `${prop} ${duration}ms ${easing}`)
      .join(', ');

    const cleanup = (): any => {
      element.style.transition = originalTransition;
      element.removeEventListener('transitionend', handleComplete);
      element.removeEventListener('transitioncancel', handleCancel);
    };

    const handleComplete = (): any => {
      cleanup();
      onComplete?.();
      resolve();
    };

    const handleCancel = (): any => {
      cleanup();
      onCancel?.();
      reject(new Error('Transition cancelled'));
    };

    element.addEventListener('transitionend', handleComplete);
    element.addEventListener('transitioncancel', handleCancel);

    requestAnimationFrame(() => {
      element.style.transition = transitionString;
      onStart?.();
    });

    // Set timeout as fallback
    setTimeout(handleComplete, duration + delay + 100);
  });
}

export async function collapse(
  element: HTMLElement,
  options: TransitionOptions = {}
): Promise<void> {
  const { height } = element.getBoundingClientRect();
  element.style.height = `${height}px`;
  
  // Force repaint
  element.offsetHeight;

  await transition(element, ['height'], {
    ...options,
    onStart: () => {
      element.style.height = '0';
      options.onStart?.();
    },
  });
}

export async function expand(
  element: HTMLElement,
  options: TransitionOptions = {}
): Promise<void> {
  element.style.height = 'auto';
  const height = element.getBoundingClientRect().height;
  element.style.height = '0';
  
  // Force repaint
  element.offsetHeight;

  await transition(element, ['height'], {
    ...options,
    onStart: () => {
      element.style.height = `${height}px`;
      options.onStart?.();
    },
    onComplete: () => {
      element.style.height = 'auto';
      options.onComplete?.();
    },
  });
}