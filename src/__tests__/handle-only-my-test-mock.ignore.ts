//
// This file is used by `handle-only-my-test.test.ts`
// Leave it as-is
//

const gbl = global as any;
gbl.handleOnlyMyTestMarkedExecutions = {};

describe('MatchedDescribe', () => {
    markExecution("MatchedDescribe");
    test('MatchedTest', () => markExecution("MatchedTest"));
});

describe('UnmatchedDescribe', () => {
    markExecution("UnmatchedDescribe");
    test('UnmatchedTest', () => markExecution("UnmatchedTest"));
});

function markExecution(name: string) {
    if (gbl.handleOnlyMyTestMarkedExecutions == null) {
        gbl.handleOnlyMyTestMarkedExecutions = {};
    }
    if (gbl.handleOnlyMyTestMarkedExecutions[name] == null) {
        gbl.handleOnlyMyTestMarkedExecutions[name] = 0;
    }
    gbl.handleOnlyMyTestMarkedExecutions[name]++;
}
