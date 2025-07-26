import { describe, it, expect, beforeEach } from 'vitest';
import { Container, Inject, Injectable } from '../container';
import { A } from './fixtures/dependency-a';

@Injectable()
class TestA {
    test() {
        return 'foo';
    }
}

@Injectable()
class TestB {
    @Inject(TestA)
    private testA!: TestA;

    get() {
        return this.testA.test();
    }

    getInstance() {
        return this.testA;
    }
}

describe("DI Container", () => {
    beforeEach(() => {
        Container.reset();
    });

    it("should create and return a registered instance", () => {
        const instance = Container.get(TestA);
        expect(instance).toBeInstanceOf(TestA);
        expect(instance.test()).toBe('foo');
    });

    it('should return the same instance on multiple gets', () => {
        const instance1 = Container.get(TestA);
        const instance2 = Container.get(TestA);
        expect(instance1).toBe(instance2);
    });

    it('should handle classes with no dependencies (empty constructor)', () => {
        @Injectable()
        class EmptyConstructorService { }

        const instance = Container.get(EmptyConstructorService);
        expect(instance).toBeInstanceOf(EmptyConstructorService);
    });

    it('should throw when trying to resolve an undecorated class', () => {
        class UnDecoratedService { }

        expect(() => Container.get(UnDecoratedService)).toThrowErrorMatchingInlineSnapshot(
            "[Error: [DI] UnDecoratedService is not registered. Use @Injectable]"
        );
    });

    it('should throw when a circular dependency is detected', () => {
        expect(() => Container.get(A)).toThrowErrorMatchingInlineSnapshot(
            '[Error: [DI] Cannot resolve dependency: type is undefined. Possible circular import or missing dependency.]'
        );
    });

    it('should reset instances', () => {
        const instance1 = Container.get(TestA);
        Container.reset();
        const instance2 = Container.get(TestA);
        expect(instance1).not.toBe(instance2);
    });
});

describe("Dependency Injection", () => {
    beforeEach(() => {
        Container.reset();
    });

    it("should inject dependencies", () => {
        const dependent = Container.get(TestB);
        expect(dependent.get()).toBe('foo');
        expect(dependent.getInstance()).toBeInstanceOf(TestA);
    });

    it('should reuse same instance in injections', () => {
        const b = Container.get(TestB);
        const a = Container.get(TestA);
        expect(b.getInstance()).toBe(a);
    });

    it('should handle deep dependency chains', () => {
        @Injectable()
        class ServiceC {
            getValue() {
                return 'C';
            }
        }

        @Injectable()
        class ServiceB {
            @Inject(ServiceC)
            private c!: ServiceC;

            getValue() {
                return this.c.getValue() + 'B';
            }
        }

        @Injectable()
        class ServiceA {
            @Inject(ServiceB)
            private b!: ServiceB;

            getValue() {
                return this.b.getValue() + 'A';
            }
        }

        const instance = Container.get(ServiceA);
        expect(instance.getValue()).toBe('CBA');
    });

    it('should inject multiple dependencies into one class', () => {
        @Injectable()
        class Foo { value = 'foo'; }

        @Injectable()
        class Bar { value = 'bar'; }

        @Injectable()
        class Consumer {
            @Inject(Foo) foo!: Foo;
            @Inject(Bar) bar!: Bar;

            getValues() {
                return [this.foo.value, this.bar.value];
            }
        }

        const consumer = Container.get(Consumer);
        expect(consumer.getValues()).toEqual(['foo', 'bar']);
    });

    it('should inject into classes that extend others', () => {
        @Injectable()
        class Logger {
            log = () => 'logged';
        }

        class BaseController {
            @Inject(Logger) logger!: Logger;
        }

        @Injectable()
        class MyController extends BaseController {
            testLog() {
                return this.logger.log();
            }
        }

        const ctrl = Container.get(MyController);
        expect(ctrl.testLog()).toBe('logged');
    });

    it('should allow injected properties to be writable', () => {
        const instance = Container.get(TestB);
        const newInstance = new TestA();
        (instance as any).testA = newInstance;

        expect(instance.getInstance()).toBe(newInstance);
    });
});