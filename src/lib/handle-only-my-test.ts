import * as path from 'path';
import { testDescribeOverride } from "./test-describe-override";

/**
 * Runs only tests that match the `testPath` parameter.
 * Also places a delay before running the first test to give IDEs time to place breakpoints int he debugger. (optional)
 *
 * @param relativePath Usually `__dirname`. The folder that has the test you want to run.
 * @param jasmineTimeout Extend the time that Jest allows fors tests to run so you have enough time to debug.
 * @param testPath Path to the file that should be tested as well as filters. EG, ["simple.test", "*"] or ["simple.test", "describe 1", "describe 2", "test 1"]
 * @param delayBeforeStart  Sometimes your IDE may need extra time before it recognizes breakpoints. This will place a wait before running any tests to help ensure the IDE recognizes the breakpoints.
 * @param afterRequireCallback A callback that executes after the test file is required. If breakpoints aren't recognized by your IDE, your IDE may need more time to initialize them.
 * @param force Force it even if the "ONLY_MY_TESTS" environment variable isn't set
 */
export function handleOnlyMyTest(relativePath: string, jasmineTimeout: null | number, testPath: string[], delayBeforeStart: number = 500, afterRequireCallback?: () => void, force: boolean = false) {
    if (!force && process.env['ONLY_MY_TESTS'] !== "true") {
        test("Nothing to do", () => { });
        return;
    }

    if (jasmineTimeout != null && typeof jasmine !== "undefined") {
        (jasmine as any).DEFAULT_TIMEOUT_INTERVAL = jasmineTimeout;
    }

    const fileName = testPath.splice(0, 1)[0];
    let filePath = path.resolve(relativePath, fileName);

    let testName: string;
    if (testPath.length > 0) {
        testName = testPath.pop() as string;
    }
    else {
        testName = "*";
    }

    if (testName === "*" && testPath.length === 0) {
        testPath.push("*");
    }

    if (filePath[1] === ":") { // Fix Windows issue where drive letter is not capitalized
        filePath = filePath[0].toUpperCase() + filePath.substr(1);
    }

    const g: any = global;
    const originals = { describe: g.describe, test: g.test };
    const impl = originals;
    let runTestsBackup: () => void = () => undefined;
    if (impl.describe == null && impl.test == null) {
        const overrides = testDescribeOverride();
        impl.describe = overrides.describe;
        impl.test = overrides.test;
    }

    if (impl.describe == null && impl.test == null) {

        const tests: { name: string; callback: any }[] = [];
        const describeStack: string[] = [];
        runTestsBackup = async () => {
            for (const test of tests) {
                console.log(`Running test : ${fileName} : ${test.name}`);
                const result = test.callback();
                if (typeof result.then === "function") {
                    await result;
                }
                console.log(`Done test : ${fileName} : ${test.name}`);
            }
        };
        impl.describe = (name: string, callback: () => any) => {
            describeStack.push(name);
            callback();
        };
        impl.test = async (name: string, callback: () => any) => {
            name = describeStack.join(" - ") + name;
            tests.push({ name, callback });
        };
    }

    const replacements = testFilter(impl.describe, impl.test, testPath, testName, delayBeforeStart);
    Object.assign(global, replacements);
    require(filePath);
    if (afterRequireCallback != null) {
        afterRequireCallback();
    }
    runTestsBackup();
    Object.assign(global, originals);
}

function testFilter(realDescribe: j.Describe, realTest: j.It, descriptionNames: string[], testName: string | null | undefined, delayBeforeStart: number = 0): { describe: j.Describe, test: j.It } {
    let hasRunOnce = (delayBeforeStart <= 0);
    const noDelayRunner = (done: undefined | j.DoneCallback, cb: j.ProvidesCallback) => {
        hasRunOnce = true;
        return cb(done as any);
    };
    const delayRunner = (done: undefined | j.DoneCallback, cb: j.ProvidesCallback): any => {
        if (cb == null) {
            throw Error("Expected Test Callback to not be null.");
        }

        if (delayBeforeStart <= 0) {
            return noDelayRunner(done, cb);
        }
        else {
            return new Promise(resolve => setTimeout(resolve, delayBeforeStart)).then(() => noDelayRunner(done, cb));
        }
    };

    function onceDelayRunner(cb: j.ProvidesCallback): any {
        if (cb.length > 0) {
            return (done: j.DoneCallback) => {
                if (hasRunOnce) {
                    return noDelayRunner(done, cb);
                }
                else {
                    hasRunOnce = true;
                    return delayRunner(done, cb);
                }
            };
        }
        else {
            return () => {
                if (hasRunOnce) {
                    return noDelayRunner(undefined as any, cb);
                }
                else {
                    hasRunOnce = true;
                    return delayRunner(undefined as any, cb);
                }
            };
        }
    }

    const matchesStack: boolean[] = [];

    const matchAnyDescription = (descriptionNames.length === 1 && descriptionNames[0] === "*");

    const _describe = (name: string, fn: j.EmptyFunction) => {
        const relevantDescriptionName = descriptionNames[matchesStack.length];
        const matches = (matchAnyDescription || relevantDescriptionName === "*" || name === relevantDescriptionName);
        matchesStack.push(matches);
        if (matches) {
            realDescribe(name, fn);
        }
        matchesStack.pop();
    };
    const describe: j.Describe = _describe as any;
    describe.only = describe;
    describe.skip = describe;

    const _test = (name: string, fn?: j.ProvidesCallback) => {
        const matchesName = (testName === "*" || testName === name);
        const matchesDescription = (matchAnyDescription || (matchesStack.length === 0 && descriptionNames.length === 0) || (matchesStack.length > 0 && matchesStack.every(z => z)));
        if (matchesName && matchesDescription) {
            if (fn == null) {
                throw Error("Function is null");
            }
            if (typeof fn !== "function") {
                throw Error("Expected a function.");
            }
            realTest(name, onceDelayRunner(fn));
        }
    };

    const test: j.It = _test as any;
    test.only = test;
    test.skip = test;
    test.concurrent = test;

    return { describe, test };
}


namespace j {

    export interface EmptyFunction {
        (): void;
    }

    export interface ProvidesCallback {
        (cb: DoneCallback): any;
    }

    export interface DoneCallback {
        (...args: any[]): any;
        fail(error?: string | { message: string }): any;
    }

    export interface Describe {
        (name: string, fn: EmptyFunction): void;
        only: Describe;
        skip: Describe;
    }


    /** Creates a test closure */
    export interface It {
        /**
         * Creates a test closure.
         *
         * @param {string} name The name of your test
         * @param {fn?} ProvidesCallback The function for your test
         */
        (name: string, fn?: ProvidesCallback): void;
        /** Only runs this test in the current file. */
        only: It;
        skip: It;
        concurrent: It;
    }
}


export function startOnlyMyTests() {
    if (process.env['ONLY_MY_TESTS'] !== "true") {
        test('Only my test', () => expect(true).toBeTruthy);
    }
    const g: any = global;
    const originals = { test: g.test, describe: g.describe };

    g.test = () => { };
    g.describe = () => { };
    return () => {
        Object.assign(g, originals);
    };
}
