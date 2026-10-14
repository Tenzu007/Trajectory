process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/trajectory_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-must-be-at-least-32-chars-length!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-must-be-at-least-32-chars-length!';
process.env.LLM_PROVIDER = 'gemini';
process.env.GEMINI_API_KEY = 'test-gemini-api-key';
