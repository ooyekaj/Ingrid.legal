// Mock playwright module for Jest tests

const mockPage = {
  goto: jest.fn().mockResolvedValue(undefined),
  waitForTimeout: jest.fn().mockResolvedValue(undefined),
  waitForSelector: jest.fn().mockResolvedValue({}),
  waitForEvent: jest.fn().mockResolvedValue({}),
  click: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(undefined),
  evaluate: jest.fn().mockResolvedValue('mock content'),
  $: jest.fn().mockResolvedValue({}),
  $$: jest.fn().mockResolvedValue([]),
  close: jest.fn().mockResolvedValue(undefined)
};

const mockContext = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined)
};

const mockBrowser = {
  newContext: jest.fn().mockResolvedValue(mockContext),
  close: jest.fn().mockResolvedValue(undefined)
};

const chromium = {
  launch: jest.fn().mockResolvedValue(mockBrowser)
};

module.exports = {
  chromium,
  mockPage,
  mockContext,
  mockBrowser
}; 