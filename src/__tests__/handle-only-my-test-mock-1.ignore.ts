//
// This file is used by `handle-only-my-test.test.ts`
// Leave it as-is
//

const g = global as any;
g.handleOnlyMyTestMarkedExecutions = {};

describe('MatchedDescribe', () => {
    markExecution("MatchedDescribe");
    test('MatchedTest', () => markExecution("MatchedTest"));
});

describe('UnmatchedDescribe', () => {
    markExecution("UnmatchedDescribe");
    test('UnmatchedTest', () => markExecution("UnmatchedTest"));
});

function markExecution(name: string) {
    if (g.handleOnlyMyTestMarkedExecutions == null) {
        g.handleOnlyMyTestMarkedExecutions = {};
    }
    if (g.handleOnlyMyTestMarkedExecutions[name] == null) {
        g.handleOnlyMyTestMarkedExecutions[name] = 0;
    }
    g.handleOnlyMyTestMarkedExecutions[name]++;
}

export { };
