
export class Deferred<T> {
    public promise: Promise<T>;
    public resolve: (value: T) => void;
    public reject: (reason: any) => void;
    public constructor() {
        const self = this;
        this.promise = new Promise<T>((resolve, reject) => {
            self.resolve = resolve;
            self.reject = reject;
        });
    }
}
