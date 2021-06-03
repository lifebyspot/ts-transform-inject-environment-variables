# Transformer Plugin: Inject Environment Variables

This `ttsc` compliant transformer allows you to inject environment variables on your code at compile time.

This is done by replacing the initializers of variable declarations. You can [learn how to](https://blogs.u2u.be/diedrik/post/typescript-transformers-transform-and-rise-up) do that, too!


## Setup

Run `npm install` to save the package in your project.

```sh
npm install -D @lifebyspot/ts-transform-inject-environment-variables 
```

## Usage

Basically, there's two main scenarios you can use to inject variables using this plugin.

First, the variables defined using `process.env` as initializer.

```ts
export const API_BASE_URL = process.env.API_BASE_URL;
export let ASDASDASDASD = process.env.ASDASDASDASD;
```

or 

```ts
export const API_BASE_URL = process.env['API_BASE_URL'];
```

Will be converted into:

```js
export const API_BASE_URL = 'https://api.example.com';
export let ASDASDASDASD;
```

Second, the variables defined using a destructuring syntax.

```ts
export const { API_BASE_URL } = process.env;
```

Will be converted into:

```js
export const { API_BASE_URL = 'https://api.example.com' } = {};
```

**Bonus:** If no environment variable is found, the variable will be uninitialized. However, it's possible to use the [nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator) operator or [object destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#object_destructuring) default values to define a default value to assign when this happens.

```ts
const { HOME = '/root' } = process.env;
const PATH = process.env.PATH ?? '/bin:/usr/bin';
```

Will be converted to:

```js
const { HOME = '/root' } = {};
const PATH = '/bin:/usr/bin';
```

> **Note:** Do not define variables that might be undefined as `const`.
> 
> ```ts
> export const ASDASDASDASD = process.env.ASDASDASDASD;
> ```
> 
> This is because, when running the compiled version, would end up with an uninitialized `const` variable, which is basically a violation of Javascript's rules.
> 
> ```js
> export const ASDASDASDASD; // Not valid
> ```

### Prerequisites

- [`ttsc`](https://github.com/cevek/ttypescript)

### Configuration

Add the plugin to the `plugins` list on `tsconfig.json`.

```json
{
    // ...
    "compilerOptions": {
        "plugins": [
            {
                "transform": "@lifebyspot/ts-transform-inject-environment-variables",
                "type": "config"
            }
        ]
    }
    // ...
}
```

### Running

Just run `ttsc` against your project working directory. That it.


## Contributing

Just send an issue or a PR! ;)
