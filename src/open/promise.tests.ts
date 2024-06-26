import {expectTypeOf} from 'expect-type';
import { createOpenPromise } from './promise';

describe('types', () => {
	xit('omit array methods', () => {
		const open = createOpenPromise();
	
		// @ts-expect-error может в будущем там можно будет
		expectTypeOf(open).not.toHaveProperty('slice');
	});

	it('unknown', () => {
		const unk = createOpenPromise();
		
		// @ts-expect-error
		expectTypeOf(unk.resolve).parameter(0).toBeString();
		expectTypeOf(unk.resolve).parameter(0).toBeUnknown();

		expectTypeOf(unk.promise).toEqualTypeOf(unk[0]);
		expectTypeOf(unk.resolve).toEqualTypeOf(unk[1]);
		expectTypeOf(unk.reject).toEqualTypeOf(unk[2]);
	});
	
	it('generic', () => {
		const str = createOpenPromise<string>();
		
		// @ts-expect-error
		expectTypeOf(str.resolve).parameter(0).toBeUnknown();
		expectTypeOf(str.resolve).parameter(0).toBeString();

		expectTypeOf(str.promise).toEqualTypeOf(str[0]);
		expectTypeOf(str.resolve).toEqualTypeOf(str[1]);
		expectTypeOf(str.reject).toEqualTypeOf(str[2]);
	});

	describe('auto', () => {
		it('primitive', () => {
			const open = createOpenPromise(() => 123);
			expectTypeOf(open.resolve).parameter(0).toBeNumber();
		});
		
		it('promise', () => {
			const open = createOpenPromise(() => Promise.resolve(true));
			expectTypeOf(open.resolve).parameter(0).toBeBoolean();
		});
	});
});

describe('api', () => {
	it('object', () => {
		const open = createOpenPromise();
		
		expect(open.promise).toBeInstanceOf(Promise);
		expect(typeof open.resolve).toBe('function')
		expect(typeof open.reject).toBe('function');
		
		expect(open.state).toBe('pending');
		expect(open.promise).toBe(open[0]);
		expect(open.resolve).toBe(open[1]);
		expect(open.reject).toBe(open[2]);

		expect(open.controller).toBeInstanceOf(AbortController);
		expect(open.controller).toBe(open[3]);
	});

	it('spred', () => {
		const [promise, resolve, reject, controller] = createOpenPromise();
		
		expect(promise).toBeInstanceOf(Promise);
		expect(typeof resolve).toBe('function')
		expect(typeof reject).toBe('function');
		expect(controller).toBeInstanceOf(AbortController);
	});

	it('resolve', async () => {
		const open = createOpenPromise<string>();
		
		open.resolve('foo');
		open.resolve('bar');
		open.reject('qux');

		await expect(open.promise).resolves.toBe('foo');
		expect(open.state).toBe('fulfilled');
	});

	it('reject', async () => {
		const open = createOpenPromise<string>();
		
		open.reject('qux');
		open.reject('bar');
		open.resolve('foo');

		await expect(open.promise).rejects.toBe('qux');
		expect(open.state).toBe('rejected');
	});

	describe('executer', () => {
		it('return <value>', async () => {
			const open = createOpenPromise(() => 123);
			await expect(open.promise).resolves.toBe(123);
		});

		it('return <promise>', async () => {
			const open = createOpenPromise(() => Promise.resolve(321));
			await expect(open.promise).resolves.toBe(321);
		});

		it('return <promise> (rejected)', async () => {
			const open = createOpenPromise(() => Promise.reject('fail'));
			await expect(open.promise).rejects.toBe('fail');
		});

		it('return <promise> (throw error)', async () => {
			const open = createOpenPromise(() => {
				throw 'error';
			});
			await expect(open.promise).rejects.toBe('error');
		});

		it('inner resolve', async () => {
			const open = createOpenPromise((resolve) => resolve(1));
			await expect(open.promise).resolves.toBe(1);
		});
		
		it('inner reject', async () => {
			const open = createOpenPromise((_, reject) => reject(1));
			await expect(open.promise).rejects.toBe(1);
		});

		it('resolve before executer', async () => {
			const executer = jest.fn(() => 'fail');
			const open = createOpenPromise(executer);
			
			open.resolve('ok');
			await expect(open.promise).resolves.toBe('ok');
			expect(executer.mock.calls.length).toBe(0);
		});

		describe('AbortController', () => {
			it('reject', async () => {
				const handleAbort = jest.fn();
				const executer = jest.fn((resolve, _, controller: AbortController) => {
					controller.signal.onabort = handleAbort;
					setTimeout(resolve, 10);
				});
				const open = createOpenPromise(executer);

				// Before tick
				expect(open.controller.signal.aborted).toBe(false);

				// Next tick
				await Promise.resolve();
				expect(executer.mock.calls.length).toBe(1);

				// Abort
				open.reject('aborted');
				await expect(open.promise).rejects.toBe('aborted');
				expect(handleAbort.mock.calls.length).toBe(1);
				expect(open.controller.signal.aborted).toBe(true);
				expect(open.controller.signal.reason).toBe('aborted');
			});
			
			it('abort', async () => {
				const executer = jest.fn();
				const open = createOpenPromise(executer);

				// Abort
				open.controller.abort('!');
				await expect(open.promise).rejects.toBe('!');
				expect(open.controller.signal.reason).toBe('!');
				expect(open.controller.signal.aborted).toBe(true);
			});
		});
	});
});