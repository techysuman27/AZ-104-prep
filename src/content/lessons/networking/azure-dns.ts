import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'azure-dns',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['dns-autoregistration', 'private-endpoint-dns', 'vnet-faq', 'appservice-custom-domain'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Names before connections',
      blocks: [
        {
          type: 'lead',
          text: 'Every connection starts with a name lookup. **Azure DNS** hosts **public zones** for your internet domains and **private zones** that resolve names only inside linked virtual networks.',
        },
        {
          type: 'explainer',
          technical: [
            'A public [[azure-dns|Azure DNS]] zone hosts records for a domain you own. To make the internet use it, set the zone’s Azure name servers at your domain registrar (delegation). Azure DNS doesn’t register domains.',
            'A [[private-dns-zone|private DNS zone]] resolves only for VNets linked to it through **virtual network links**. With **autoregistration** on a link, VMs in that VNet get A records automatically.',
            'VMs using Azure-provided DNS send queries to the virtual IP 168.63.129.16. VNets can instead point to custom DNS servers.',
          ],
          simple: [
            'DNS is the internet’s phone book: names to numbers.',
            'A **public zone** is your listing in the world’s phone book. A **private zone** is your company’s internal directory that only your own networks can read.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Records and delegation',
      blocks: [
        {
          type: 'table',
          caption: 'Common record types',
          columns: ['Type', 'Maps', 'Example'],
          rows: [
            ['A', 'Name → IPv4 address', 'www → 203.0.113.10'],
            ['AAAA', 'Name → IPv6 address', 'www → 2001:db8::10'],
            ['CNAME', 'Name → another name', 'shop → contoso-shop.azurewebsites.net'],
            ['MX', 'Mail exchanger for the domain', '@ → mail.contoso.com'],
            ['TXT', 'Text, often verification', 'asuid.www → app verification ID'],
            ['NS', 'Name servers for the zone or a delegated child', '@ → Azure name servers'],
          ],
        },
        {
          type: 'steps',
          title: 'Host a public domain in Azure DNS',
          steps: [
            { title: 'Create the zone', detail: 'Create a DNS zone named contoso.com in a resource group.' },
            { title: 'Add record sets', detail: 'A, CNAME, MX and TXT records as needed.' },
            { title: 'Delegate', detail: 'Copy the zone’s four Azure name servers into the NS settings at your domain registrar.' },
            { title: 'Verify', detail: 'Query the domain’s NS records and a test record from outside your network.' },
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Public and private zones',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Public zone and a record
az network dns zone create --resource-group rg-dns --name contoso.com
az network dns record-set a add-record --resource-group rg-dns --zone-name contoso.com \\
  --record-set-name www --ipv4-address 203.0.113.10
az network dns zone show --resource-group rg-dns --name contoso.com --query nameServers

# Private zone with autoregistration for VMs in vnet-app
az network private-dns zone create --resource-group rg-dns --name corp.contoso.internal
az network private-dns link vnet create --resource-group rg-dns --zone-name corp.contoso.internal \\
  --name link-vnet-app --virtual-network <vnet-app-resource-id> --registration-enabled true`,
              notes: [
                { token: 'nameServers', note: 'Enter these at your registrar to delegate the domain to Azure DNS.' },
                { token: '--registration-enabled true', note: 'Autoregistration: VMs in the VNet get A records automatically.' },
              ],
            },
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'A VNet can be linked to only **one** private DNS zone with autoregistration enabled; a zone can be linked to many VNets.',
            'Autoregistration creates A records for VMs (primary NIC) only; add other records manually.',
            'Records are removed when the VM is deleted.',
            'For hybrid name resolution, Azure DNS Private Resolver lets on-premises DNS forward queries into Azure.',
          ],
        },
      ],
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      blocks: [
        {
          type: 'mistakes',
          items: [
            { mistake: 'Creating a public zone and never updating the registrar.', fix: 'The internet keeps using the old name servers until you delegate.' },
            { mistake: 'Linking a spoke VNet to a second private zone with autoregistration.', fix: 'Only one autoregistration zone per VNet — link other zones for resolution only.' },
            { mistake: 'Expecting VMs in an unlinked VNet to resolve private zone names.', fix: 'Link the zone to every VNet whose clients need those names.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Know delegation (registrar NS records), virtual network links, and the one-autoregistration-zone-per-VNet rule.' },
        { type: 'quickcheck', questionIds: ['nw-dns-delegation', 'nw-private-dns-autoreg'] },
      ],
    },
  ],
  takeaways: [
    'Public zones need delegation at the registrar; Azure DNS doesn’t register domains.',
    'Private zones resolve only in linked VNets.',
    'Autoregistration creates VM A records; one autoregistration zone per VNet.',
    'Azure-provided DNS is reached at 168.63.129.16.',
  ],
};

export default lesson;
