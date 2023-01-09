/** OpenPromise Object */
export type OpenPromiseLike<T> = [
    Promise<T>,
    (value: T) => void,
    (reason: unknown) => void
] & {
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
): OpenPromiseLike<Awaited<T>> => {
    const d = [] as unknown as OpenPromiseLike<Awaited<T>>;

    d[0] = d.promise = new Promise<any>((resolve, reject) => {
        d[1] = d.resolve = resolve;
        d[2] = d.reject = reject;

        if (executer) {
            Promise.resolve().then(() => {
                try {
                    resolve(executer(resolve, reject));
                } catch (reason) {
                    reject(reason);
                }
            });
        }
    });

    return d;
};