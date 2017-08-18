import * as fs from 'fs';
import * as util from 'util';
import { UtilTestConfig, UtilTest } from "../lib/index";

test('UtilTest.output', async () => {
    let data = {a: "b"};
    let dataFormatted = util.inspect(data);

    let utilTest = new UtilTest({ output: { preFolderName: "dev-testing" }});
    let filePath = await utilTest.output("dev-testing-output.test.json", data);
    if (filePath == null) { throw new Error("filePath is null"); }

    let fileContents = fs.readFileSync(filePath);
    let fileStr = fileContents.toString();
    expect(fileStr).toBe(dataFormatted);
});
