interface JSS {
    options: { createGenerateClassName: () => (rule: Object, stylesheet?: Object) => string };
}

export function create(preset: any): JSS;
