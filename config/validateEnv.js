// Validate required environment variables
const validateEnv = () => {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'PORT'
  ];
  
  const missing = [];
  
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for better security.');
  }
  
  console.log('✅ Environment variables validated successfully');
};

module.exports = validateEnv;
