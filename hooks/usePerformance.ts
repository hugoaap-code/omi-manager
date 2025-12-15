import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing values
 * Improves performance by reducing unnecessary re-renders and API calls
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook for throttling function calls
 * Useful for scroll events or frequent user interactions
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 300
): T {
    const lastRun = useRef(Date.now());

    return useCallback(
        ((...args) => {
            const now = Date.now();
            if (now - lastRun.current >= delay) {
                callback(...args);
                lastRun.current = now;
            }
        }) as T,
        [callback, delay]
    );
}

/**
 * Custom hook for optimized intersection observer
 * Better performance for infinite scroll
 */
export function useIntersectionObserver(
    callback: () => void,
    options?: IntersectionObserverInit
) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const elementRef = useRef<HTMLElement | null>(null);

    const observe = useCallback((element: HTMLElement | null) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        if (element) {
            observerRef.current = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        callback();
                    }
                },
                options
            );

            observerRef.current.observe(element);
            elementRef.current = element;
        }
    }, [callback, options]);

    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    return observe;
}
