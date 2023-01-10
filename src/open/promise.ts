const STATE_PENDING = 'pending';

/** OpenPromise Object */
export type OpenPromise<T> = [
    Promise<T>,
    (value: T) => void,
    (reason: unknown) => void,
    AbortController,
] & {
    state: 'pending' | 'fulfilled' | 'rejected';
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: unknown) => void;
    abortController: AbortController;
};

/** Create OpenPromise */
export const createOpenPromise = <T>(
    executer?: (
        resolve: (value: Awaited<T>) => void,
        reject: (reason: unknown) => void,
        controller: AbortController,
    ) => T,
): OpenPromise<Awaited<T>> => {
    // Create OpenTuple
    const open = Array(4) as unknown as OpenPromise<Awaited<T>>;

    // Lazy AbortController (to not care about of polyfill)
    let abortController: AbortController | undefined;
    const abortControllerProp = {
        get: () => abortController || (abortController = new AbortController()),
    };

    Object.defineProperties(open, {
        3: abortControllerProp,
        abortController: abortControllerProp,
    });

    // Initial State
    open.state = STATE_PENDING;
    
    // Create promise
    open[0] = open.promise = new Promise((originalResolve, originalReject) => {
        const resolve = open[1] = open.resolve = (value) => {
            if (open.state !== STATE_PENDING) return;
            open.state = 'fulfilled';
            originalResolve(value);
        };

        const reject = open[2] = open.reject = (reason) => {
            if (open.state !== STATE_PENDING) return;
            open.state = 'rejected';
            originalReject(reason);
            abortController?.abort();
        };

        if (executer) {
            Promise.resolve().then(() => {
                if (open.state !== STATE_PENDING) return;

                try {
                    const result = executer(
                        resolve,
                        reject,
                        executer.length > 2 ? abortControllerProp.get() : null as any,
                    ) as Awaited<T>;

                    if (result && typeof result === 'object' && 'then' in result) {
                        resolve(result);
                    } else if (executer.length === 0 || result !== undefined) {
                        resolve(result);
                    }
                } catch (err) {
                    reject(err);
                }
            });
        }
    });

    return open;
};