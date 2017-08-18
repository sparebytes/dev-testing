import * as fs from 'fs';
import * as util from 'util';
import { UtilTest } from "../lib/index";

test('UtilTest.output', async () => {
    const data = { a: "b" };
    const dataFormatted = util.inspect(data);

    const utilTest = new UtilTest({ output: { preFolderName: "dev-testing" } });
    const filePath = await utilTest.output("dev-testing-output.test.json", data);
    if (filePath == null) { throw new Error("filePath is null"); }

    const fileContents = fs.readFileSync(filePath);
    const fileStr = fileContents.toString();
    expect(fileStr).toBe(dataFormatted);
});
