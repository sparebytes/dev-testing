
export interface UtilTestConfig {
    output?: FolderOutput;
}

export type FolderOutput = AbsoluteFolderOutput | RelativeFolderOutput;

export interface BaseFolderOutput {
    nowFormat?: string;
}

export interface AbsoluteFolderOutput extends BaseFolderOutput {
    folderPath: string;
    preFolderName?: undefined;
}

export interface RelativeFolderOutput extends BaseFolderOutput {
    folderPath?: undefined;
    preFolderName: string;
}
