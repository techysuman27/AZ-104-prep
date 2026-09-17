import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'nsg-asg',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['nsg-overview', 'asg', 'vnet-faq', 'lb-probes'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Filtering traffic with rules in priority order',
      blocks: [
        {
          type: 'lead',
          text: 'A **network security group (NSG)** is a list of allow and deny rules applied to a subnet or network interface. Rules are checked from the **lowest priority number** up, and the **first match wins**.',
        },
        {
          type: 'explainer',
          technical: [
            'Each [[nsg|NSG]] rule has a priority (100–4096), source and destination (IP/CIDR, [[service-tag|service tag]] or [[asg|application security group]]), protocol, port range, direction and action.',
            'NSGs are **stateful**: when an inbound flow is allowed, the return traffic is allowed automatically.',
            'Default rules (priority 65000+) allow traffic within the virtual network and from the Azure load balancer, allow outbound internet, and deny everything else. They can’t be deleted, only overridden with lower priority numbers.',
          ],
          simple: [
            'An NSG is a bouncer with a numbered checklist. The bouncer reads the list from the smallest number and stops at the first line that matches the visitor.',
            'If a visitor is let in, they’re also allowed to leave the same way — you don’t need a separate “let them out” rule.',
          ],
        },
        {
          type: 'analogy',
          title: 'Guest list with numbered rules',
          story: 'A venue’s guest list reads: “100: staff may enter through the side door. 200: no one may enter through the side door. 65500: nobody else gets in.” A staff member matches rule 100 first and walks in; a stranger at the side door hits rule 200.',
          mapping: [
            { analogy: 'Rule number', azure: 'Priority (lower number = checked first)' },
            { analogy: 'Who (staff, anyone)', azure: 'Source: IP range, service tag or ASG' },
            { analogy: 'Which door', azure: 'Destination port and protocol' },
            { analogy: '“Nobody else gets in” at the bottom', azure: 'Default rule DenyAllInbound (65500)' },
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Default rules',
      blocks: [
        {
          type: 'table',
          caption: 'Inbound default rules',
          columns: ['Priority', 'Name', 'Source', 'Destination', 'Action'],
          rows: [
            ['65000', 'AllowVNetInBound', 'VirtualNetwork', 'VirtualNetwork', 'Allow'],
            ['65001', 'AllowAzureLoadBalancerInBound', 'AzureLoadBalancer', 'Any', 'Allow'],
            ['65500', 'DenyAllInbound', 'Any', 'Any', 'Deny'],
          ],
        },
        {
          type: 'table',
          caption: 'Outbound default rules',
          columns: ['Priority', 'Name', 'Source', 'Destination', 'Action'],
          rows: [
            ['65000', 'AllowVnetOutBound', 'VirtualNetwork', 'VirtualNetwork', 'Allow'],
            ['65001', 'AllowInternetOutBound', 'Any', 'Internet', 'Allow'],
            ['65500', 'DenyAllOutBound', 'Any', 'Any', 'Deny'],
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'The **VirtualNetwork** service tag includes the VNet’s address space, peered VNets and connected on-premises ranges. Without extra rules, every VM can reach every port on every other VM across those networks.',
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Application security groups: rules by role, not IP',
      blocks: [
        {
          type: 'p',
          text: 'Instead of listing IP addresses, add each VM’s NIC to an [[asg|application security group]] such as `asg-web`, `asg-app` or `asg-db`, and write rules against those groups. Scaling out or re-addressing VMs doesn’t require rule changes.',
        },
        {
          type: 'table',
          caption: 'A three-tier NSG using ASGs',
          columns: ['Priority', 'Source', 'Destination', 'Port', 'Action'],
          rows: [
            ['100', 'Internet', 'asg-web', 'TCP 443', 'Allow'],
            ['110', 'asg-web', 'asg-app', 'TCP 8080', 'Allow'],
            ['120', 'asg-app', 'asg-db', 'TCP 1433', 'Allow'],
            ['130', 'Any', 'asg-db', 'TCP 1433', 'Deny'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Rule 130 matters: without it, AllowVNetInBound (65000) would let any VM in the VNet reach the database port. All NICs in an ASG must be in the same virtual network.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Create an NSG, ASG and rules',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az network nsg create --resource-group rg-net --name nsg-web
az network asg create --resource-group rg-net --name asg-web

az network nsg rule create --resource-group rg-net --nsg-name nsg-web \\
  --name Allow-HTTPS-Internet --priority 100 --direction Inbound --access Allow \\
  --protocol Tcp --source-address-prefixes Internet \\
  --destination-asgs asg-web --destination-port-ranges 443

# Put the web VM's NIC in the ASG and apply the NSG to the subnet
az network nic ip-config update --resource-group rg-net --nic-name nic-web01 \\
  --name ipconfig1 --application-security-groups asg-web
az network vnet subnet update --resource-group rg-net --vnet-name vnet-app \\
  --name snet-web --network-security-group nsg-web`,
              notes: [
                { token: '--priority 100', note: '100–4096. Lower numbers are evaluated first. Two rules in the same direction can’t share a priority.' },
                { token: '--source-address-prefixes Internet', note: 'A service tag representing addresses outside the virtual network.' },
                { token: '--destination-asgs', note: 'Targets NICs in the application security group instead of IPs.' },
              ],
            },
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
            { mistake: 'Adding an allow rule at priority 4000 and a deny rule at 300 for the same traffic, then wondering why it’s blocked.', fix: 'The lowest number wins — the deny at 300 matches first.' },
            { mistake: 'Creating outbound rules for response traffic.', fix: 'NSGs are stateful; return traffic for allowed flows is automatic.' },
            { mistake: 'Blocking the AzureLoadBalancer tag with a broad deny rule.', fix: 'Health probes from 168.63.129.16 fail and every backend becomes unhealthy. Keep them allowed.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Given a rule table, find the first matching rule by priority for the traffic’s direction, protocol, port, source and destination. Don’t forget the default rules at the bottom.' },
        { type: 'quickcheck', questionIds: ['nw-nsg-priority', 'nw-asg-same-vnet'] },
      ],
    },
  ],
  takeaways: [
    'NSG rules are evaluated by priority (100–4096); the first match stops evaluation.',
    'NSGs are stateful — return traffic is allowed automatically.',
    'Default rules allow VNet-to-VNet and load balancer probes, allow outbound internet, and deny everything else.',
    'Application security groups let rules target roles instead of IPs; members must be in the same VNet.',
    'Add explicit denies between tiers, because AllowVNetInBound allows intra-VNet traffic.',
  ],
};

export default lesson;
