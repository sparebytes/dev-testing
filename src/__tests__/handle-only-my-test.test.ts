import { handleOnlyMyTest } from "../lib/index";

import { Deferred } from '../lib/deferred';

test('handleOnlyMyTest instant', () => {
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

    handleOnlyMyTest(__dirname, null, ["./handle-only-my-test-mock-1.ignore", "MatchedDescribe", "MatchedTest"], 0, () => {
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


test('handleOnlyMyTest delayed', async () => {
    const g: any = global;
    const original = { test: g.test, describe: g.describe };

    g.handeOnlyMyTestDeferred = new Deferred<void>();
    const describeDeferred = new Deferred<void>();

    const delayTime = 500;
    const maxDelayTime = delayTime * 2;

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
        describeDeferred.resolve(undefined);
    }

    const tooLate = new Promise((resolve, reject) => setTimeout(() => reject("Took too long!"), maxDelayTime));

    const startDate = new Date();

    handleOnlyMyTest(__dirname, null, ["./handle-only-my-test-mock-2.ignore", "MatchedDescribe", "MatchedTest"], 500, () => {
        postRequireCallCount++;
    }, true);

    await Promise.race([
        tooLate,
        Promise.all([
            g.handeOnlyMyTestDeferred.promise,
            describeDeferred.promise,
        ])
    ]);


    expect(g.handeOnlyMyTestFirstExecutionDate).not.toBeNull();
    const elapsedTime = (g.handeOnlyMyTestFirstExecutionDate as Date).valueOf() - startDate.valueOf();
    expect(elapsedTime).toBeGreaterThan(delayTime);
    expect(testCallCount).toEqual(1);
    expect(describeCallCount).toEqual(1);
    expect(postRequireCallCount).toEqual(1);
    expect(g.handleOnlyMyTestMarkedExecutions).toEqual({
        MatchedTest: 1,
        MatchedDescribe: 1,
    });

    delete g.handeOnlyMyTestFirstExecutionDate;
    delete g.handeOnlyMyTestDeferred;
    delete g.handleOnlyMyTestMarkedExecutions;
    Object.assign(g, original);
});
