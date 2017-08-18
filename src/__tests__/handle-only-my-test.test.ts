import { handleOnlyMyTest } from "../lib/index";

test('handleOnlyMyTest', async () => {
    const g: any = global;
    const original = { test: g.test, describe: g.describe };

    let postRequireCallCount = 0;
    let testCallCount = 0;
    let describeCallCount = 0;
    g.test = (name: string, callback: () => string) => {
        testCallCount++;
        callback();
    }
    g.describe = (name: string, callback: () => string) => {
        describeCallCount++;
        callback();
    }

    handleOnlyMyTest(__dirname, null, ["./handle-only-my-test-mock.ignore", "MatchedDescribe", "MatchedTest"], () => {
        postRequireCallCount++;
    }, true);

    expect(testCallCount).toEqual(1);
    expect(describeCallCount).toEqual(1);
    expect(postRequireCallCount).toEqual(1);
    expect(g.handleOnlyMyTestMarkedExecutions).toEqual({
        MatchedTest: 1,
        MatchedDescribe: 1,
    });

    delete g.handleOnlyMyTestMarkedExecutions;
    Object.assign(g, original);
});
