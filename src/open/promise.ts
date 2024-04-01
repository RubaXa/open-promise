const STATE_PENDING = 'pending';

type NotReadonly<T> = {-readonly [P in keyof T]: T[P]};

/** OpenPromise Object */
export type OpenPromise<T> = readonly [
    promise: Promise<T>,
    resolve: (value: T) => void,
    reject: (reason: unknown) => void,
    controller: AbortController,
] & {
    readonly state: 'pending' | 'fulfilled' | 'rejected';
    readonly promise: Promise<T>;
    readonly resolve: (value: T) => void;
    readonly reject: (reason: unknown) => void;
    readonly controller: AbortController;
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
    const open = Array(4) as unknown as NotReadonly<OpenPromise<Awaited<T>>>;

    // Lazy AbortController (to not care about of polyfill)
    let controller: AbortController | undefined;
    const controllerProp = {
        get: () => {
            if (!controller) {
                controller = new AbortController();
                controller.signal.addEventListener('abort', () => {
                    open.reject(controller!.signal.reason);
                });
            }

            return controller;
        },
    };

    Object.defineProperties(open, {
        3: controllerProp,
        controller: controllerProp,
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
            controller?.abort(reason);
        };

        if (executer) {
            Promise.resolve().then(() => {
                if (open.state !== STATE_PENDING) return;

                try {
                    const result = executer(
                        resolve,
                        reject,
                        executer.length > 2 ? controllerProp.get() : null as any,
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