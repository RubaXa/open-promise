const STATE_PENDING = 'pending';

type NotReadonly<T> = {-readonly [P in keyof T]: T[P]};
type PromiseExecuter<T> = (
    resolve: (value: Awaited<T>) => void,
    reject: (reason: unknown) => void,
    controller: AbortController,
) => T

/** OpenPromise Object */
export type OpenPromise<T> = readonly [
    promise: Promise<T>,
    resolve: (value: T | Promise<T>) => void,
    reject: (reason: unknown) => void,
    controller: AbortController,
] & {
    readonly state: 'pending' | 'fulfilled' | 'rejected';
    readonly promise: Promise<T>;
    readonly resolve: (value: T | Promise<T>) => void;
    readonly reject: (reason: unknown) => void;
    readonly controller: AbortController;
};

/** Create open promise with optional executer */
export function createOpenPromise<T>(executer?: PromiseExecuter<T>): OpenPromise<Awaited<T>>;
/** Create open promise with AbortController or AbortSignal and optional executer */
export function createOpenPromise<T>(
    ctrlOrSignal: AbortController | AbortSignal,
    executer?: PromiseExecuter<T>,
): OpenPromise<Awaited<T>>;
export function createOpenPromise<T>(
    executerOrCtrlOrSignal?: PromiseExecuter<T> | AbortController | AbortSignal,
    executer?: PromiseExecuter<T>,
): OpenPromise<Awaited<T>> {
    // Create OpenTuple
    const open = Array(4) as unknown as NotReadonly<OpenPromise<Awaited<T>>>;

    // Initial State
    open.state = STATE_PENDING;

    // Lazy AbortController (to not care about of polyfill)
    let ctrl: AbortController | undefined;
    let ctrlInited = false
    const initCtrl = () => {
        ctrl ||= new AbortController();
        
        if (!ctrlInited) {
            ctrlInited = true;
            ctrl.signal.addEventListener('abort', (e) => {
                open.reject(ctrl!.signal.reason);
            });
        }

        return ctrl;
    }

    // AbortController or AbortSignal passed
    if (executerOrCtrlOrSignal instanceof AbortController) {
        ctrl = executerOrCtrlOrSignal;
        initCtrl();
    } else if (executerOrCtrlOrSignal instanceof AbortSignal) {
        ctrl = new AbortController();

        if (executerOrCtrlOrSignal.aborted) {
            ctrl!.abort(executerOrCtrlOrSignal.reason);
        } else {
            executerOrCtrlOrSignal.addEventListener('abort', () => {
                ctrl!.abort(executerOrCtrlOrSignal.reason);
            });
        }

        initCtrl();
    } else {
        executer = executerOrCtrlOrSignal as PromiseExecuter<T>;
    }

    // Add a lazy getter to get AbortController
    const ctrlPropDescr = {get: initCtrl};
    Object.defineProperties(open, {
        3: ctrlPropDescr, // by Index
        controller: ctrlPropDescr,
    });
    
    // Create promise
    open[0] = open.promise = new Promise((originalResolve, originalReject) => {
        // Resolve
        const resolve = open[1] = open.resolve = (value) => {
            if (open.state !== STATE_PENDING) return;
            
            open.state = 'fulfilled';
            originalResolve(value);
        };

        // Reject
        const reject = open[2] = open.reject = (reason) => {
            if (open.state !== STATE_PENDING) return;

            open.state = 'rejected';
            originalReject(reason);
            ctrl?.abort(reason);
        };

        // Check AbortController
        if (ctrl?.signal.aborted) {
            reject(ctrl.signal.reason);
            return;
        }

        // Run executer?
        if (executer) {
            Promise.resolve().then(() => {
                if (open.state !== STATE_PENDING) return;

                try {
                    const result = executer(
                        resolve,
                        reject,
                        executer.length > 2 ? initCtrl() : null as any,
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
