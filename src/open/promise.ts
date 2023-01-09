const STATE_PENDING = 'pending';

/** OpenPromise Object */
export type OpenPromise<T> = [
    Promise<T>,
    (value: T) => void,
    (reason: unknown) => void,
] & {
    state: 'pending' | 'fulfilled' | 'rejected';
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: unknown) => void;
};

/** Create OpenPromise */
export const createOpenPromise = <T>(
    executer?: (
        resolve: (value: Awaited<T>) => void,
        reject: (reason: unknown) => void,
    ) => T,
): OpenPromise<Awaited<T>> => {
    const d = [] as unknown as OpenPromise<Awaited<T>>;

    d.state = STATE_PENDING;

    d[0] = d.promise = new Promise((originalResolve, originalReject) => {
        const resolve = d[1] = d.resolve = (value) => {
            if (d.state !== STATE_PENDING) return;
            d.state = 'fulfilled';
            originalResolve(value);
        };

        const reject = d[2] = d.reject = (reason) => {
            if (d.state !== STATE_PENDING) return;
            d.state = 'rejected';
            originalReject(reason);
        };

        if (executer) {
            Promise.resolve().then(() => {
                if (d.state !== STATE_PENDING) return;

                try {
                    resolve(executer(resolve, reject) as Awaited<T>);
                } catch (reason) {
                    reject(reason);
                }
            });
        }
    });

    return d;
};