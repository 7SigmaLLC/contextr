module.exports = {
    '*.{ts,tsx}': [
      'prettier --write',
      // Run tsc without appending file names
      () => 'tsc --noEmit',
      'jest --bail --findRelatedTests'
    ]
  };
  