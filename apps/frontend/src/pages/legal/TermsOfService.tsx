import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const TermsOfService = () => {
    return (<div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Terms of Service</CardTitle>
          <p className="text-sm text-muted-foreground">Last updated: January 17, 2025</p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using The New Fuse website (https://thenewfuse.com), you accept and agree
            to be bound by these Terms of Service. If you do not agree to these terms, do not use our
            service.
          </p>

          <h2>2. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND,
            EXPRESS OR IMPLIED. The New Fuse AND ITS OWNERS, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS
            MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY, RELIABILITY, COMPLETENESS, OR
            TIMELINESS OF THE CONTENT, SERVICES, SOFTWARE, TEXT, GRAPHICS, LINKS, OR COMMUNICATIONS
            PROVIDED ON OR THROUGH THE USE OF THE SERVICE.
          </p>

          <h2>3. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL The New Fuse, ITS DIRECTORS,
            EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION,
            LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul>
            <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE</li>
            <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE</li>
            <li>ANY CONTENT OBTAINED FROM THE SERVICE</li>
            <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT</li>
          </ul>

          <h2>4. No Professional Advice</h2>
          <p>
            The information provided through our service is for general informational purposes only.
            It does not constitute professional advice of any kind. Any reliance you place on such
            information is strictly at your own risk.
          </p>

          <h2>5. Service Modifications</h2>
          <p>
            We reserve the right to modify or discontinue, temporarily or permanently, the service
            or any features or portions thereof without prior notice. You agree that we will not be
            liable for any modification, suspension, or discontinuance of the service.
          </p>

          <h2>6. Account Terms</h2>
          <p>
            You are responsible for maintaining the security of your account and password. We cannot
            and will not be liable for any loss or damage from your failure to comply with this
            security obligation.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality are and will remain
            the exclusive property of The New Fuse. Our service is protected by copyright,
            trademark, and other laws.
          </p>

          <h2>8. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the service immediately,
            without prior notice or liability, under our sole discretion, for any reason
            whatsoever, including but not limited to a breach of the Terms.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the United
            States, without regard to its conflict of law provisions.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any
            changes by posting the new Terms of Service on this page. Your continued use of the
            service after any such changes constitutes your acceptance of the new Terms of Service.
          </p>

          <h2>11. Contact</h2>
          <p>
            For any questions about these Terms of Service, please contact us at:
            legal@thenewfuse.com
          </p>
        </CardContent>
      </Card>
    </div>);
};
export default TermsOfService;
//# sourceMappingURL=TermsOfService.js.map