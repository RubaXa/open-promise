Open Promise 👐
---------------
Micro tool for creating Promise likes Deferred.

```sh
npm i --save o-promise
```

---

### Usage

```js
import {createOpenPromise} from 'o-promise';

// 1. Tuple
const [promise, resolve, reject] = createOpenPromise<string>();

// 2. Deferred
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

// 5. With executer + resolvers
const open = createOpenPromise((resolve, reject) => {
	// Your Logic
});
```

---

### Support AbortController

#### Open "fetch"

```js
import {createOpenPromise} from 'o-promise';

const openFetch = createOpenPromise((_, _, abortController) => {
	return fetch('...', {signal: abortController.signal});
});

// Reject
openFetch.reject('aborted');

// Or `AbortController#abort`
openFetch.abortController.abort();
```

---

### 100% covergae ;]