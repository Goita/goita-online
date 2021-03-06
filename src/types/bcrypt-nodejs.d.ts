/** Declaration file generated by dts-gen */

export function compare(data: string, hash: string, callback: (err: Error, isMatch: boolean) => void): void;

export function compareSync(data: string, hash: string): boolean;

export function genSalt(rounds: number, callback: (err: Error, salt: string) => void): void;

export function genSaltSync(rounds: number): string;

export function getRounds(hash: string): number;

export function hash(data: string, salt: string, hash: (err: Error, salt: string) => string, progress: (progress: number) => void): void;

export function hashSync(data: string, salt: string): string;

