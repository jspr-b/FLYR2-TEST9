const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://jasper:pindakaas@fly.83cukhh.mongodb.net/flyr-dashboard?retryWrites=true&w=majority&appName=fly";

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database access
    const db = client.db('flyr-dashboard');
    const collections = await db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // Test creating a simple document
    const testCollection = db.collection('test');
    const result = await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date() 
    });
    console.log('✅ Successfully inserted test document:', result.insertedId);
    
    // Clean up
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Cleaned up test document');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await client.close();
  }
}

testConnection(); 