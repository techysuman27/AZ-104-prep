import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'app-service-domains-tls',
  moduleId: 'app-service',
  verified: '2026-09-16',
  sources: ['appservice-custom-domain', 'appservice-certs', 'appservice-plans'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Two records, then a certificate',
      blocks: [
        {
          type: 'lead',
          text: 'Mapping a custom domain is always the same shape: a record that **points** at the app, a TXT record that **proves you own the domain**, and then a certificate bound to the hostname.',
        },
        {
          type: 'explainer',
          technical: [
            'The plan must be a **paid tier** — the Free (F1) tier cannot host a custom domain. The domain must live in a public DNS zone; private zones are not supported.',
            'Root domain (`contoso.com`) → an **A record** pointing at the app’s IP address. Subdomain (`www.contoso.com`) or wildcard (`*.contoso.com`) → a **CNAME** to the app’s default hostname, which survives IP changes.',
            'Alongside it, a **TXT record named `asuid`** (root or wildcard) or `asuid.<subdomain>` holds the app’s domain verification ID. It is strongly recommended: it prevents another App Service app from taking over your subdomain.',
          ],
          simple: [
            'One DNS record tells the internet where your site lives. A second record proves the domain is really yours.',
            'After that, a certificate turns http into https so browsers stop warning visitors.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Which record for which name',
      blocks: [
        {
          type: 'table',
          columns: ['Scenario', 'Example', 'Mapping record', 'Verification record'],
          rows: [
            ['Root domain', 'contoso.com', 'A → the app’s IP address', 'TXT named `asuid`'],
            ['Subdomain', 'www.contoso.com', 'CNAME → the app’s default hostname (or A → IP)', 'TXT named `asuid.www`'],
            ['Wildcard', '*.contoso.com', 'CNAME → the app’s default hostname', 'TXT named `asuid`'],
          ],
          caption: 'Do not use a CNAME for a root domain; a subdomain CNAME is preferred over an A record because the app’s inbound IP can change.',
        },
        {
          type: 'steps',
          title: 'Map and secure a domain',
          steps: [
            { title: 'Scale the plan to a paid tier', detail: 'Free (F1) cannot host custom domains. A managed certificate needs Basic or higher.' },
            { title: 'Start Add custom domain in the app', detail: 'The portal shows the exact mapping record and the domain verification ID for the TXT record.' },
            { title: 'Create both DNS records at your provider', detail: 'The mapping record (A or CNAME) and the asuid TXT record.' },
            { title: 'Validate and add', detail: 'App Service checks both records before binding the hostname.' },
            { title: 'Bind a certificate', detail: 'Choose an App Service managed certificate, or upload/import your own and create the binding.' },
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Certificates and binding types',
      blocks: [
        {
          type: 'compare',
          items: [
            {
              name: 'App Service managed certificate',
              bestFor: 'A domain you have mapped to the app and want secured with no extra cost or renewal work',
              points: ['Free and created for you', 'Available from the Basic tier upward', 'Managed and renewed by the platform'],
            },
            {
              name: 'App Service certificate',
              bestFor: 'A certificate you buy and manage in Azure, stored in Key Vault',
              points: ['Purchased in Azure and renewed annually — a paid item', 'Can be used across apps', 'Managed through Key Vault'],
            },
            {
              name: 'Bring your own (private) certificate',
              bestFor: 'A certificate issued by your own CA or an external provider',
              points: ['Uploaded or imported from Key Vault', 'You own renewal and re-binding', 'Required when the issuer must be your own CA'],
            },
          ],
        },
        {
          type: 'table',
          columns: ['Binding type', 'What it does', 'Cost and tier'],
          rows: [
            ['SNI SSL', 'Several certificates secure several domains on the same IP address, selected by the hostname the client requests', 'Free; supported by all modern browsers'],
            ['IP-based SSL', 'One certificate bound to a dedicated public IP address for the app', 'Only one per app; hourly charge for the IP-based TLS connection; supported in Standard tier or above'],
          ],
          caption: 'Configuring an IP-based binding changes the app’s inbound IP address, so any A record must be remapped afterwards.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# After both DNS records exist and have propagated
az webapp config hostname add --webapp-name app-contoso-portal \\
  --resource-group rg-web-prod --hostname www.contoso.com

# Create a free managed certificate for that hostname
az webapp config ssl create --resource-group rg-web-prod \\
  --name app-contoso-portal --hostname www.contoso.com

# Bind it (SNI)
az webapp config ssl bind --resource-group rg-web-prod --name app-contoso-portal \\
  --certificate-thumbprint <thumbprint> --ssl-type SNI

# Force HTTPS
az webapp update --resource-group rg-web-prod --name app-contoso-portal --https-only true`,
              notes: [
                { token: 'hostname add', note: 'Fails until both the mapping record and the asuid TXT record resolve correctly.' },
                { token: '--ssl-type SNI', note: 'SNI bindings are free and let several certificates share one IP address.' },
                { token: '--https-only true', note: 'Redirects HTTP to HTTPS. Note that HTTPS Only is a slot setting and does not travel with a swap.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'troubleshoot',
      kind: 'troubleshoot',
      title: 'The domain doesn’t work',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'domain-trouble',
            title: 'Custom domain troubleshooting',
            start: 'q1',
            nodes: {
              q1: {
                kind: 'question',
                text: 'What do you see?',
                options: [
                  { label: 'Validation fails when adding the domain', next: 'q2' },
                  { label: 'The browser warns the page is not secure', next: 'r-cert' },
                  { label: 'HTTP 404 from the custom domain', next: 'r-404' },
                ],
              },
              q2: {
                kind: 'question',
                text: 'Do both DNS records resolve from a public resolver?',
                options: [
                  { label: 'The asuid TXT record is missing or wrong', next: 'r-txt' },
                  { label: 'Both look right but validation still fails', next: 'r-propagation' },
                ],
              },
              'r-txt': { kind: 'result', title: 'Fix the verification record', text: 'The TXT record must be named asuid (root or wildcard) or asuid.<subdomain>, and its value must be the app’s domain verification ID.', concepts: ['app-service'] },
              'r-propagation': { kind: 'result', title: 'Wait for propagation, then re-validate', text: 'DNS changes take time to propagate, and some providers need an explicit save. Confirm with a public resolver before retrying.', tone: 'caution', concepts: ['app-service'] },
              'r-cert': { kind: 'result', title: 'No certificate binding yet', text: 'The hostname is mapped but has no certificate. Create a managed certificate or import one, then bind it to the hostname.', concepts: ['app-service-certificate'] },
              'r-404': { kind: 'result', title: 'Stale IP or an IP-based binding', text: 'Clear the DNS cache, and if you configured an IP-based binding remap the A record to the app’s new inbound IP address.', concepts: ['app-service'] },
            },
          },
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Record-type questions are common: root domain → A record, subdomain → CNAME, verification → TXT named asuid or asuid.<subdomain>. Free tier cannot host a custom domain.' },
        { type: 'quickcheck', questionIds: ['app-domain-records', 'app-domain-tier', 'app-tls-binding'] },
      ],
    },
  ],
  takeaways: [
    'Custom domains need a paid tier and a public DNS zone.',
    'Root domain → A record; subdomain and wildcard → CNAME.',
    'The asuid TXT record proves ownership and prevents subdomain takeover.',
    'SNI bindings are free and share an IP; IP-based bindings need Standard or above, cost per hour and change the app’s IP.',
  ],
};

export default lesson;
