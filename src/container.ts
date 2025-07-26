/**
 * A constructable type representing a class constructor.
 * @template T The instance type created by the constructor.
 */
type Constructable<T = any> = new (...args: any[]) => T;

/**
 * Metadata associated with a registered class.
 * @template T The instance type of the class.
 */
interface Metadata<T = any> {
    /** Cached singleton instance of the class, if created */
    instance?: T;
}

/** 
 * Registry of classes marked as @Injectable along with their metadata.
 */
const registry = new Map<Constructable, Metadata>();

/**
 * Map storing the property injection metadata for classes.
 * Key: class constructor
 * Value: array of injection definitions ({ property key, dependency class })
 */
const injections = new Map<Constructable, { key: string | symbol; dependency: Constructable }[]>();

/**
 * Class decorator to mark a class as injectable (register it in the DI container).
 * @returns ClassDecorator function
 */
export function Injectable(): ClassDecorator {
    return function (target: any) {
        if (!registry.has(target)) {
            // Register the class with empty metadata
            registry.set(target, {});
        }
    };
}

/**
 * Property decorator to inject a dependency into a class property.
 * @param dependency The class constructor of the dependency to inject
 * @returns PropertyDecorator function
 */
export function Inject(dependency: Constructable): PropertyDecorator {
    return function (target: any, propertyKey: string | symbol) {
        const constructor = target.constructor;

        if (!injections.has(constructor)) {
            injections.set(constructor, []);
        }

        // Register the property injection for this class
        injections.get(constructor)!.push({
            key: propertyKey,
            dependency,
        });
    };
}

/**
 * Dependency Injection container responsible for resolving and caching singleton instances.
 */
class DIContainer {
    /**
     * Tracks classes currently being resolved to detect circular dependencies.
     */
    private resolving = new Set<Constructable>();

    /**
     * Resolves a dependency by its class constructor.
     * Throws if the dependency is not registered or a circular dependency is detected.
     * @template T The type of the resolved dependency instance
     * @param type The class constructor to resolve
     * @returns The resolved instance
     */
    get<T>(type: Constructable<T>): T {
        if (!type) {
            throw new Error(
                `[DI] Cannot resolve dependency: type is undefined. Possible circular import or missing dependency.`
            );
        }

        if (!registry.has(type)) {
            throw new Error(`[DI] ${type.name} is not registered. Use @Injectable`);
        }

        const meta = registry.get(type)!;

        // Return cached instance if available (singleton behavior)
        if (meta.instance) {
            return meta.instance;
        }

        // Detect circular dependencies by checking if this type is already being resolved
        if (this.resolving.has(type)) {
            throw new Error(`[DI] Circular dependency detected while resolving ${type.name}`);
        }

        this.resolving.add(type);

        try {
            // Instantiate the class without constructor parameters (can be extended later)
            const instance = new type();

            // Walk the prototype chain to support injections on parent classes
            let current: Constructable | null = type;
            while (current) {
                const currentInjections = injections.get(current);
                if (currentInjections) {
                    for (const { key, dependency } of currentInjections) {
                        // Recursively resolve dependencies and assign to the instance property
                        Object.defineProperty(instance, key, {
                            value: this.get(dependency),
                            writable: true,
                            configurable: true,
                        });
                    }
                }

                // Move up the prototype chain, stopping at Object
                const proto = Object.getPrototypeOf(current.prototype);
                current = proto?.constructor !== Object ? proto?.constructor : null;
            }

            // Cache the instance for future requests
            meta.instance = instance;
            return instance;
        } finally {
            // Remove from resolving set to allow future resolutions
            this.resolving.delete(type);
        }
    }

    /**
     * Resets the container by clearing all cached singleton instances.
     * Useful for testing or resetting state.
     */
    reset() {
        for (const meta of registry.values()) {
            delete meta.instance;
        }
    }
}

/**
 * The global DI container instance.
 */
export const Container = new DIContainer();