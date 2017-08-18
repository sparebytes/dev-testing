import * as util from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as moment from 'moment';
import * as mkpath from 'mkpath';
import * as _debug from 'debug';

import * as constants from './constants';
const debug = _debug(constants.moduleName);

import { UtilTestConfig } from './util-test-config';

export { UtilTestConfig };

export class UtilTest {
    protected config: UtilTestConfig;
    protected mkdirpPromise: Promise<void>;
    protected outputFolderPath: string;

    constructor(tmpConfig?: UtilTestConfig|null) {
        if (tmpConfig == null) {
            this.outputFolderPath = generateTmpFolderPath();
            this.config = {
                output: { folderPath: this.outputFolderPath }
            }
            debug("No configuration provided. Generating config. %j", this.config);
        }
        else {
            this.config = tmpConfig;
            let tOutputFolderPath = this.config.output && this.config.output.folderPath;
            if (tOutputFolderPath == null) {
                this.outputFolderPath = generateTmpFolderPath(this.config.output && this.config.output.preFolderName);
            }
            else {
                this.outputFolderPath = tOutputFolderPath;
            }

            debug("Future outputs will be to %s", this.outputFolderPath);
        }

        if (this.outputFolderPath == null) {
            this.mkdirpPromise = Promise.reject(new Error("No output folder provided"));
        }
        else {
            this.mkdirpPromise = new Promise<void>((s, f) => {
                mkpath(this.outputFolderPath, err => {
                    if (err) {
                        console.error("UtilTest constructor(): Error while making path!", err);
                        f(err);
                    }
                    else {
                        s();
                    }
                });
            });
        }
    }

    output(name: string, data: any): Promise<string|null> {
        try {
            if (this.outputFolderPath == null) return Promise.resolve(null);

            const now = moment(new Date());
            const nowFormat = this.config.output && this.config.output.nowFormat || "MM-DD_HHmmss";
            const nowStr = now.format(nowFormat);

            const fileName = `${nowStr}_${name}`;
            const filePath = path.join(this.outputFolderPath, fileName);

            let dataFormatted: string|Buffer;
            let dataType: string;
            if (typeof data === "string") {
                dataType = "string";
                dataFormatted = data;
            }
            else if (data instanceof Buffer) {
                dataType = "Buffer";
                dataFormatted = data;
            }
            else {
                dataType = typeof data;
                dataFormatted = util.inspect(data, { depth: 8 });
            }

            debug("Outputting %s of length %s to %s", dataType, dataFormatted.length, filePath);
            return this.mkdirpPromise.then(() => {
                return new Promise<string|null>((s,f) => {
                    fs.writeFile(filePath, dataFormatted, (err) => {
                        if (err) {
                            console.error("UtilTest.output(): Error while writing file!", err);
                            f(err);
                        }
                        else {
                            s(filePath);
                        }
                    });
                });
            });
        }
        catch (err) {
            console.error("UtilTest.output(): Unexpected error!", err);
            return Promise.reject(err);
        }
    }

    static instanceMaker(config: UtilTestConfig): () => UtilTest {
        let utInstance: UtilTest|undefined = undefined;
        return () => {
            if (utInstance == null) {
                utInstance = new UtilTest(config);
            }
            return utInstance;
        }
    }

}

function generateTmpFolderPath(preFolder?: string): string {
    let now = moment(new Date());
    let nowFormatted = now.format("YYYY-MM-DD_HHmmss");
    let result = path.join(os.tmpdir(), constants.tempFolder);
    if (preFolder != null) {
        result = path.resolve(result, preFolder);
    }
    result = path.join(result, nowFormatted);
    return result;
}
