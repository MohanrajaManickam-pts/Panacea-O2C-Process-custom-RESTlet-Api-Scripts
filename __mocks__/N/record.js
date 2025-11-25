module.exports = {
  load: jest.fn().mockReturnValue({
    getValue: jest.fn(),
    setValue: jest.fn(),
    save: jest.fn()
  }),
  create: jest.fn()
};