export interface ScaffoldFile {
    name: string;
    content: string;
    subdir?: string;
    openOnCreate?: boolean;
    inWsRoot?: boolean;
}

export interface Input {
    name: string;
    type: string; // bool, intX, uintX, address, bytesX, bytes, string, array, tuple, function, contract, enum
    internalType: string;
}

export interface Func {
    name: string;
    inputs: Input[];
    stateMutability: string;
}

export interface Contract {
    name: string;
    filePath: string;
    functions: Func[];
    ctor?: Func;
}