export function testDescribeOverride() {
    const overrides = getTestDescribe();
    const g: any = global;
    g.test = overrides.test;
    g.describe = overrides.describe;
    return overrides;
}

export function getTestDescribe() {
    const tests: { name: string; callback: any }[] = [];
    const describeStack: string[] = [];
    async function runTestsBackup() {
        for (const testC of tests) {
            console.log(`Running test : ${testC.name}`);
            const result = testC.callback();
            if (typeof result.then === "function") {
                await result;
            }
            console.log(`Done test : ${testC.name}`);
        }
    }
    function describe(name: string, callback: () => any): void {
        describeStack.push(name);
        callback();
    }
    function test(name: string, callback: () => any): void {
        name = describeStack.join(" - ") + name;
        tests.push({ name, callback });
    }

    return { describe, test, runTestsBackup };
}
