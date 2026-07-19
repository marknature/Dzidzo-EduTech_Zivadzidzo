/**
 * Historical experiments are kept under archive for provenance, not as part of
 * the production runtime or its quality gate. Keep Jest focused on active code.
 */
module.exports = {
  testPathIgnorePatterns: ['<rootDir>/archive/'],
};
