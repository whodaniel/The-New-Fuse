import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const PrivacyPolicy = () => {
    return (<div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Privacy Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Last updated: January 17, 2025</p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2>1. Introduction</h2>
          <p>
            Welcome to The New Fuse ("we," "our," or "us"). We respect your privacy and are committed
            to protecting your personal data. This privacy policy will inform you about how we handle
            your personal data when you visit our website (https://thenewfuse.com) and tell you about
            your privacy rights.
          </p>

          <h2>2. Data We Collect</h2>
          <p>We collect and process the following types of personal data:</p>
          <ul>
            <li>Identity Data (name, username)</li>
            <li>Contact Data (email address)</li>
            <li>Technical Data (IP address, browser type, device information)</li>
            <li>Usage Data (how you use our website and services)</li>
            <li>Authentication Data (Google OAuth information if you choose to sign in with Google)</li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <p>We use your personal data for these purposes:</p>
          <ul>
            <li>To provide and maintain our service</li>
            <li>To notify you about changes to our service</li>
            <li>To provide customer support</li>
            <li>To gather analytics to improve our service</li>
            <li>To prevent fraud and maintain security</li>
          </ul>

          <h2>4. Data Storage and Security</h2>
          <p>
            We implement appropriate security measures to protect your personal data against
            unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2>5. Third-Party Services</h2>
          <p>
            We use third-party services, including Google OAuth for authentication. These services
            have their own privacy policies, and we recommend reviewing them.
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Request transfer of your data</li>
          </ul>

          <h2>7. Contact Us</h2>
          <p>
            For any questions about this privacy policy or our privacy practices, please contact us
            at: privacy@thenewfuse.com
          </p>

          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes
            by posting the new privacy policy on this page and updating the "last updated" date.
          </p>
        </CardContent>
      </Card>
    </div>);
};
export default PrivacyPolicy;
//# sourceMappingURL=PrivacyPolicy.js.map