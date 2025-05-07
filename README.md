Open Promise 👐
---------------
Micro tool for creating [OpenPromise](./src/open/promise.ts#L3-L15) likes Deferred (with AbortController support).

```sh
npm i --save o-promise
```

---

### Usage

```js
import {createOpenPromise} from 'o-promise';

// 1. Tuple
const [promise, resolve, reject] = createOpenPromise<string>();

// 2. or Deferred
const {promise, resolve, reject} = createOpenPromise<number>();

// 3. With executer + return
const open = createOpenPromise(() => {
	return '...';
});

open.state; // pending
open.reject('canceled'); // `executer` — won't be called
open.state; // rejected

// 4. With executer + promise
const open = createOpenPromise(() => {
	// for example
	return fetch('...');
});

// 5. With executer + resolvers + controller
const open = createOpenPromise((resolve, reject, controller) => {
	// Your Logic
});
```

---

### Support AbortController and AbortSignal

#### Dependent `OpenPromise` on `AbortController`

```js
const parentController = new AbortController();
const open = createOpenPromise<number>(parentController); // <- AbortController

open.promise.catch(reason => {
	console.info('OpenPromise canceled by parentController:', reason);
});

parentController.abort('canceled'); // ℹ️: open.controller === parentController;
```

---

#### Dependent `OpenPromise` on `AbortSignal`

```js
const parentController = new AbortController();
const open = createOpenPromise<number>(parentController.signal); // <- AbortSignal

open.promise.catch(reason => {
	console.info('OpenPromise canceled by parentSignal:', reason);
});

parentController.abort('canceled'); // ⚠️: open.controller !== parentController;
```

---

#### Example: Open "fetch"

```js
import {createOpenPromise} from 'o-promise';

const openFetch = createOpenPromise((_, __, controller) => {
	return fetch('...', {signal: controller.signal});
});

// Reject
openFetch.reject('canceled');

// Or `AbortController#abort`
openFetch.controller.abort('canceled');
```

---

### 100% code & types coverage ;]