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
open.reject('aborted'); // `executer` — won't be called
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

### 100% covergae ;]