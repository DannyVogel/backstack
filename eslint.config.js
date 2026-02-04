import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['**/*.md'],
  rules: {
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    'no-console': 'off',
  },
})
