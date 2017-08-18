import * as path from 'path';
import { testDescribeOverride } from "./test-describe-override";

export function handleOnlyMyTest(relativePath: string, jasmineTimeout: null|number, testPath: string[], afterRequireCallback?: () => void, force: boolean = false) {
    if (force || process.env['ONLY_MY_TESTS'] === "true") {
        if (jasmineTimeout != null && typeof jasmine !== "undefined") {
            (jasmine as any).DEFAULT_TIMEOUT_INTERVAL = jasmineTimeout;
        }

        let fileName = testPath.splice(0, 1)[0];
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
        };


        const g: any = global;
        let originals = { describe: g.describe, test: g.test };
        let impl = originals;
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
                    let result = test.callback();
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
                tests.push({ name: name, callback: callback });
            }
        }

        let replacements = testFilter(impl.describe, impl.test, testPath, testName);
        Object.assign(global, replacements);
        require(filePath);
        if (afterRequireCallback != null) {
            afterRequireCallback();
        }
        runTestsBackup();
        Object.assign(global, originals);
    }
    else {
        test("Nothing to do", () => {});
    }
}

export function testFilter(realDescribe: j.Describe, realTest: j.It, descriptionNames: string[], testName: string|null|undefined): { describe: j.Describe, test: j.It } {
    let matchesStack: boolean[] = [];

    let matchAnyDescription = (descriptionNames.length === 1 && descriptionNames[0] === "*");

    let _describe = (name: string, fn: j.EmptyFunction) => {
        let relevantDescriptionName = descriptionNames[matchesStack.length];
        let matches = (matchAnyDescription || relevantDescriptionName === "*" || name === relevantDescriptionName);
        matchesStack.push(matches);
        if (matches) {
            realDescribe(name, fn);
        }
        matchesStack.pop();
    };
    let describe: j.Describe = _describe as any;
    describe.only = describe;
    describe.skip = describe;

    let _test = (name: string, fn?: j.ProvidesCallback) => {
        let matchesName = (testName === "*" || testName === name);
        let matchesDescription = (matchAnyDescription || (matchesStack.length === 0 && descriptionNames.length === 0) || (matchesStack.length > 0 && matchesStack.every(z => z)));
        if (matchesName && matchesDescription) {
            realTest(name, fn);
        }
    };

    let test: j.It = _test as any;
    test.only = test;
    test.skip = test;
    test.concurrent = test;

    return { describe, test };
}


export namespace j {

    export interface EmptyFunction {
        (): void;
    }

    export interface ProvidesCallback {
        (cb: DoneCallback): any;
    }

    export interface DoneCallback {
        (...args: any[]): any
        fail(error?: string | { message: string }): any;
    }

    export interface Describe {
        (name: string, fn: EmptyFunction): void
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
    }
}
