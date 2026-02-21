import { eq, isNull } from 'drizzle-orm';
import { db } from '../../packages/database/src/drizzle/client';
import { agents } from '../../packages/database/src/drizzle/schema/agents';

/**
 * Script to verify if Augment has been registered in the database
 * Updated to use Drizzle ORM
 */
async function verifyAugmentRegistration(): Promise<any> {
  try {
    console.log('Checking if Augment is registered...');

    // Check if Augment exists in the database using Drizzle
    const [augmentAgent] = await db.select().from(agents).where(eq(agents.name, 'Augment'));

    if (augmentAgent && isNull(agents.deletedAt)) {
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
