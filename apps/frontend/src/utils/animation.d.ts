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
export declare function animate(element: HTMLElement, keyframes: Keyframe[], options?: AnimationOptions): Animation;
export declare function fadeIn(element: HTMLElement, options?: AnimationOptions): Animation;
export declare function fadeOut(element: HTMLElement, options?: AnimationOptions): Animation;
export declare function slideIn(element: HTMLElement, direction?: 'left' | 'right' | 'top' | 'bottom', options?: AnimationOptions): Animation;
export declare function slideOut(element: HTMLElement, direction?: 'left' | 'right' | 'top' | 'bottom', options?: AnimationOptions): Animation;
export declare function transition(element: HTMLElement, properties: string[], options?: TransitionOptions): Promise<void>;
export declare function collapse(element: HTMLElement, options?: TransitionOptions): Promise<void>;
export declare function expand(element: HTMLElement, options?: TransitionOptions): Promise<void>;
