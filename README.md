OpenPromise 👐
--------------
Micro tool for creating Promise like Deferred

```sh
npm i --save open-promise
```

---

### Usage

```js
import {createOpenPromise} from 'open-promise';

// 1. Tuple
const [promise, resolve, reject] = createOpenPromise<string>();

// 2. Deferred
const {promise, resolve, reject} = createOpenPromise<number>();

// 3. With executer
const open = createOpenPromise<boolean>((resolve, reject) => {
	// Your Logic
});
open.reject('aborted');
```