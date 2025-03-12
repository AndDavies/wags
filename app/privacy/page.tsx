// app/privacy/page.tsx
export default function PrivacyPage() {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-brand-teal mb-8">Privacy Policy</h1>
        <div className="prose prose-lg text-gray-600">
          <p><strong>Last Updated: March 12, 2025</strong></p>
          <p>
            Wags & Wanders ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our website (https://wagsandwanders.com), mobile app, or services (collectively, the "Services"). By using the Services, you agree to the practices described in this Privacy Policy. If you do not agree, please do not use the Services.
          </p>
          <h2>1. Information We Collect</h2>
          <h3>1.1 Personal Information</h3>
          <p>We may collect the following personal information when you interact with our Services:</p>
          <ul>
            <li><strong>Email Address</strong>: When you sign up for our newsletter or create an account.</li>
            <li><strong>Account Information</strong>: Full name, email address, and password when you register via our signup page.</li>
            <li><strong>Profile Information</strong>: Details about you and your pet (e.g., pet name, travel preferences) when you complete our onboarding process or update your profile.</li>
            <li><strong>Contact Information</strong>: If you contact us directly (e.g., via email or contact form).</li>
          </ul>
          <h3>1.2 Usage Data</h3>
          <p>We automatically collect certain information when you use the Services:</p>
          <ul>
            <li><strong>Analytics Data</strong>: Usage data, IP address, browser type, device information, and pages visited, collected via Vercel Analytics and Google Analytics.</li>
            <li><strong>Cookies</strong>: We use cookies and similar technologies to enhance your experience, such as remembering your preferences.</li>
          </ul>
          <h3>1.3 Information from Third Parties</h3>
          <p>We may receive information from third-party services:</p>
          <ul>
            <li><strong>Supabase</strong>: We use Supabase to store user data (e.g., email subscribers, account information).</li>
            <li><strong>Email Services</strong>: We use Nodemailer to send welcome emails when you subscribe to our newsletter.</li>
          </ul>
          <h2>2. How We Use Your Information</h2>
          <p>We use your information for the following purposes:</p>
          <ul>
            <li><strong>To Provide Services</strong>: To manage your account, store travel documents, and plan itineraries.</li>
            <li><strong>To Communicate</strong>: To send you newsletters, updates, and promotional offers (if you’ve subscribed to our mailing list).</li>
            <li><strong>To Improve Our Services</strong>: To analyze usage data and improve the functionality and user experience of our Services.</li>
            <li><strong>To Comply with Legal Obligations</strong>: To fulfill legal requirements, such as GDPR compliance for EU users.</li>
          </ul>
          <h3>Lawful Basis for Processing (GDPR)</h3>
          <p>For users in the European Economic Area (EEA), we process your personal data based on the following lawful bases:</p>
          <ul>
            <li><strong>Consent</strong>: When you subscribe to our newsletter or provide personal information during signup.</li>
            <li><strong>Contract</strong>: To fulfill our obligations when you use our Services (e.g., itinerary planning).</li>
            <li><strong>Legitimate Interests</strong>: For analytics and improving our Services, where it does not override your rights.</li>
          </ul>
          <h2>3. How We Share Your Information</h2>
          <p>We may share your information with:</p>
          <ul>
            <li><strong>Service Providers</strong>: Third-party providers like Supabase (data storage), Nodemailer (email sending), Vercel Analytics, and Google Analytics (usage tracking).</li>
            <li><strong>Legal Authorities</strong>: If required by law or to protect our rights, safety, or property.</li>
            <li><strong>Business Transfers</strong>: In the event of a merger, acquisition, or sale of assets, your information may be transferred.</li>
          </ul>
          <h2>4. Your Rights (GDPR Compliance)</h2>
          <p>If you are an EEA resident, you have the following rights under GDPR:</p>
          <ul>
            <li><strong>Access</strong>: Request access to the personal data we hold about you.</li>
            <li><strong>Rectification</strong>: Request correction of inaccurate or incomplete data.</li>
            <li><strong>Erasure</strong>: Request deletion of your data (e.g., via our unsubscribe link).</li>
            <li><strong>Restriction</strong>: Request that we restrict processing of your data.</li>
            <li><strong>Data Portability</strong>: Request a copy of your data in a structured, machine-readable format.</li>
            <li><strong>Object</strong>: Object to processing based on legitimate interests (e.g., analytics).</li>
            <li><strong>Withdraw Consent</strong>: Withdraw consent at any time where processing is based on consent (e.g., newsletters).</li>
          </ul>
          <p>To exercise these rights, contact us at hello@wagsandwanders.com.</p>
          <h2>5. Data Retention</h2>
          <ul>
            <li><strong>Email Subscribers</strong>: We retain your email address in our mailing list until you unsubscribe.</li>
            <li><strong>User Accounts</strong>: We retain your account information (e.g., email, full name, pet details) until you delete your account or request erasure.</li>
            <li><strong>Usage Data</strong>: Analytics data is retained as per the policies of Vercel Analytics and Google Analytics.</li>
          </ul>
          <h2>6. Cookies and Tracking Technologies</h2>
          <p>We use cookies to:</p>
          <ul>
            <li>Enhance your experience (e.g., remembering preferences).</li>
            <li>Analyze usage (via Vercel Analytics and Google Analytics).</li>
          </ul>
          <p>You can manage cookie preferences through your browser settings. However, disabling cookies may affect the functionality of our Services.</p>
          <h2>7. Data Security</h2>
          <p>We implement reasonable security measures (e.g., encryption, secure storage via Supabase) to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          <h2>8. International Data Transfers (GDPR)</h2>
          <p>Your data may be transferred to and stored in countries outside the EEA, such as Canada (where we are based) or the US (where Supabase and other providers operate). We ensure such transfers comply with GDPR through appropriate safeguards (e.g., Standard Contractual Clauses).</p>
          <h2>9. Third-Party Links</h2>
          <p>Our Services may contain links to third-party websites (e.g., social media). We are not responsible for the privacy practices of these sites. Review their privacy policies before providing information.</p>
          <h2>10. Children’s Privacy</h2>
          <p>Our Services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such data, we will delete it.</p>
          <h2>11. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.</p>
          <h2>12. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or wish to exercise your GDPR rights, contact us at:</p>
          <ul>
            <li><strong>Email</strong>: hello@wagsandwanders.com</li>
            <li><strong>Phone</strong>: +1 (289) 472-5592</li>
            <li><strong>Address</strong>: Toronto, Canada</li>
          </ul>
          <h3>Data Protection Officer (GDPR)</h3>
          <p>For EEA users, you can contact our Data Protection Officer at hello@wagsandwanders.com. If you’re unsatisfied with our response, you may lodge a complaint with your local data protection authority (e.g., the Information Commissioner’s Office in the UK).</p>
        </div>
      </div>
    );
  }