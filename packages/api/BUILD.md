# Building the API Package

This document provides instructions for building the `@the-new-fuse/api`
package, including handling temporary TypeScript errors.

## Standard Build (May Fail Due to TS Errors)

```bash
yarn workspace @the-new-fuse/api build
```

This uses the TypeScript compiler directly and will fail if there are TypeScript
errors.

## Force Build (Skip Some Type Checking)

```bash
yarn workspace @the-new-fuse/api build:force
```

Uses TypeScript compiler with extra flags to skip some type checking, but may
still fail on errors.

## JavaScript-Only Build (Ignores All TS Errors)

```bash
yarn workspace @the-new-fuse/api build:js-only
```

This custom script bypasses the TypeScript compiler entirely and just copies
files to the dist folder with .js extensions.

## Production Build (Recommended)

```bash
yarn workspace @the-new-fuse/api build:production
```

This runs the JavaScript-only build to ensure JavaScript output is generated,
and then runs the TypeScript checker separately (but doesn't fail the build if
there are type errors).

## Understanding TypeScript Errors

We have a comprehensive plan for fixing TypeScript errors systematically - see
[TYPESCRIPT_ERROR_PLAN.md](./TYPESCRIPT_ERROR_PLAN.md).

## Adding New Code

When adding new code to the repository:

1. Make sure to define proper TypeScript types
2. Add JSDoc comments for functions and classes
3. Test that your code doesn't introduce new TypeScript errors

## Troubleshooting

If you encounter build errors:

1. First try with `build:production` to get working JavaScript output
2. If you need to fix TypeScript errors specifically, refer to the error plan
3. For urgent fixes, focus on the specific files causing issues rather than
   fixing all errors at once
