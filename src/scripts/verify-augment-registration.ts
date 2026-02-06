import { DrizzleClient } from '@drizzle/client';

/**
 * Script to verify if Augment has been registered in the database
 */
async function verifyAugmentRegistration(): any {
  const drizzle = new DrizzleClient();
  
  try {
    console.log('Checking if Augment is registered...');
    
    // Check if Augment exists in the database
    const augmentAgent = await drizzle.agent.findFirst({
      where: {
        name: 'Augment',
        deletedAt: null
      }
    });
    
    if (augmentAgent) {
      console.log('Augment is registered with ID:', augmentAgent.id);
      console.log('Agent details:', JSON.stringify(augmentAgent, null, 2));
      return augmentAgent;
    } else {
      console.log('Augment is not registered yet.');
      return null;
    }
  } catch (error) {
    console.error('Error verifying Augment registration:', error);
    throw error;
  } finally {
    await drizzle.$disconnect();
  }
}

// Run the verification if this script is run directly
if (require.main === module) {
  verifyAugmentRegistration()
    .then(() => {
      console.log('Verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export { verifyAugmentRegistration };
