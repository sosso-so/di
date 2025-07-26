# Simple TypeScript Dependency Injection Container

A minimal dependency injection container for TypeScript with class and property decorators, supporting singleton lifecycle and circular dependency detection.

## Features

- Mark classes as injectable with `@Injectable()`
- Inject dependencies into class properties with `@Inject()`
- Singleton scope by default (one instance per class)
- Circular dependency detection with helpful error messages
- Supports injection across class inheritance chains
- Simple API, zero dependencies

---

## Installation

`npm install @sossohq/di`

---

## Usage

### Mark a class as injectable

```ts
import { Injectable } from '@sossohq/di';

@Injectable()
class Logger {
  log(message: string) {
    console.log('[LOG]', message);
  }
}
```

### Inject dependencies into properties

```ts
import { Inject } from '@sossohq/di';

@Injectable()
class Service {
  @Inject(Logger)
  logger!: Logger;

  doSomething() {
    this.logger.log('Service is doing something');
  }
}
```

### Resolve instances with the container

```ts
import { Container } from '@sossohq/di';

const service = Container.get(Service);
service.doSomething();
```

The same instance of Logger will be shared across all injections (singleton behavior).

---

## API

`@Injectable(): ClassDecorator`
Marks a class as injectable and registers it in the container.

`@Inject(dependency: Constructable): PropertyDecorator`
Injects the given dependency class instance into the decorated property.

`Container.get<T>(type: Constructable<T>): T`
Resolves an instance of the requested class, injecting dependencies recursively.

`Container.reset(): void`
Clears all cached singleton instances. Useful in testing scenarios.

---

## Circular Dependency Detection

If a circular dependency is detected during resolution, an error will be thrown with a message like:

`[DI] Cannot resolve dependency: type is undefined. Possible circular import or missing dependency.`

or maybe..

`[DI] Circular dependency detected while resolving Class`

---

## Notes & Limitations

1. Only supports property injection currently (no constructor injection)
2. Assumes injectable classes have a zero-argument constructor
3. Designed as a simple demonstration and lightweight container, not for large-scale use