import paypal from '../services/paypal.service.js';

async function setupPayPal() {
  console.log('Setting up PayPal Products and Plans...');

  try {
    const accessToken = await paypal.getAccessToken();
    const baseUrl =
      paypal.environment.constructor.name === 'LiveEnvironment'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    // 1. Create Product
    const productResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: 'AI Video Intelligence Suite',
        description: 'AI Video Analysis and Content Repurposing',
        type: 'SERVICE',
        category: 'SOFTWARE',
        image_url: 'https://aivideointelligence.com/logo.png',
        home_url: 'https://aivideointelligence.com',
      }),
    });

    const product = await productResponse.json();
    console.log('Product Created:', product.id);

    // 2. Create Plans
    const plans = [
      {
        name: 'Pro Monthly',
        description: 'Pro Tier - Monthly Subscription',
        interval_unit: 'MONTH',
        interval_count: 1,
        price: '9.99',
      },
      {
        name: 'Pro Yearly',
        description: 'Pro Tier - Yearly Subscription',
        interval_unit: 'YEAR',
        interval_count: 1,
        price: '99.00',
      },
      {
        name: 'TNF Monthly',
        description: 'The New Fuse - Monthly Subscription',
        interval_unit: 'MONTH',
        interval_count: 1,
        price: '49.00',
      },
      {
        name: 'TNF Yearly',
        description: 'The New Fuse - Yearly Subscription',
        interval_unit: 'YEAR',
        interval_count: 1,
        price: '490.00',
      },
    ];

    const createdPlans = {};

    for (const plan of plans) {
      const planResponse = await fetch(`${baseUrl}/v1/billing/plans`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          name: plan.name,
          description: plan.description,
          status: 'ACTIVE',
          billing_cycles: [
            {
              frequency: {
                interval_unit: plan.interval_unit,
                interval_count: plan.interval_count,
              },
              tenure_type: 'REGULAR',
              sequence: 1,
              total_cycles: 0, // Infinite
              pricing_scheme: {
                fixed_price: {
                  value: plan.price,
                  currency_code: 'USD',
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: {
              value: '0',
              currency_code: 'USD',
            },
            setup_fee_failure_action: 'CONTINUE',
            payment_failure_threshold: 3,
          },
        }),
      });

      const planData = await planResponse.json();
      console.log(`Plan Created (${plan.name}):`, planData.id);

      const key = `PAYPAL_PLAN_${plan.name.toUpperCase().replace(/ /g, '_')}`;
      createdPlans[key] = planData.id;
    }

    console.log('\n--- ADD THESE TO YOUR .env FILE ---');
    console.log(`PAYPAL_PRODUCT_ID=${product.id}`);
    for (const [key, value] of Object.entries(createdPlans)) {
      console.log(`${key}=${value}`);
    }
    console.log('-----------------------------------\n');
  } catch (error) {
    console.error('Error setting up PayPal:', error);
  }
}

setupPayPal();
