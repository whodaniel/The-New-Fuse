import axios from 'axios';

const BASE_URL = 'http://localhost:3007';

async function testVectorSynapse() {
    console.log("[🔭] Testing Native Vector Synapse Interop...");

    try {
        // 1. Health check
        const health = await axios.get(`${BASE_URL}/health`);
        console.log(`     Health: ${health.data}`);

        // 2. Add vectors
        const docs = [
            { id: 'doc1', embedding: new Array(1536).fill(0).map((_, i) => (i === 0 ? 1.0 : 0.0)), metadata: { content: 'This is the first document' } },
            { id: 'doc2', embedding: new Array(1536).fill(0).map((_, i) => (i === 1 ? 1.0 : 0.0)), metadata: { content: 'This is the second document' } },
            { id: 'doc3', embedding: new Array(1536).fill(0).map((_, i) => (i === 0 ? 0.9 : i === 1 ? 0.1 : 0.0)), metadata: { content: 'This is similar to doc1' } }
        ];

        console.log("[📤] Adding 3 vectors...");
        await axios.post(`${BASE_URL}/vectors`, docs);

        // 3. Search
        console.log("[🔍] Searching for vectors similar to doc1...");
        const query = {
            embedding: new Array(1536).fill(0).map((_, i) => (i === 0 ? 1.0 : 0.0)),
            limit: 5,
            threshold: 0.5
        };

        const response = await axios.post(`${BASE_URL}/search`, query);
        console.log("[🏁] Search Results:");
        response.data.forEach((r, i) => {
            console.log(`     ${i+1}. ID: ${r.id}, Score: ${r.score.toFixed(4)}, Content: ${r.metadata.content}`);
        });

        if (response.data[0].id === 'doc1' && response.data[1].id === 'doc3') {
            console.log("[🎊] NATIVE VECTOR SYNAPSE VERIFIED!");
        } else {
            console.log("[❌] Verification failed.");
        }

    } catch (error) {
        if (error.response) {
            console.error(`[💥] Server Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(`[💥] Request Error: ${error.message}`);
            console.error(error);
        }
    }
}

testVectorSynapse();
