# Verified facts — Networking (verified 2026-09-14)

## Default outbound access (updated 2026-09-10)
- VM without explicit outbound method gets a Microsoft-owned "default outbound access IP" (can change without notice)
- Explicit outbound methods: NAT gateway on subnet (recommended for most); Standard LB with outbound rules; Standard public IP on NIC; Azure Firewall/NVA via UDR
- For API versions released after March 31, 2026: new VNets' subnets default to PRIVATE (defaultOutboundAccess = false). Portal already defaults to private subnets. Existing VNets unchanged.
- Private subnet: VMs need explicit outbound to reach internet/public Microsoft endpoints (e.g., Windows Activation & Windows Update need it); storage accounts in same region still reachable
- Changing subnet private↔non-private requires VMs stop/deallocate to take effect
- UDR routes with next hop Internet break in private subnet (service endpoints unaffected)
- Default outbound IPs don't support fragmented packets or ICMP ping; Flexible VMSS instances never get default outbound IP (secure by default)
- Portal: Virtual networks > Subnets > "Default outbound access" = Disabled ; CLI az network vnet subnet update --default-outbound false
- Advisor Operational Excellence recommendation "Add explicit outbound method to disable default outbound"
- URL: https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/default-outbound-access

## Public IP addresses (updated 2026-02-25)
- Basic SKU public IPs RETIRED September 30, 2025 → upgrade to Standard
- SKUs: Standard (v1) and Standard v2 (Standard v2 currently only usable with Standard v2 NAT gateway); Basic (retired)
- Standard: static allocation only; secure by default (closed to inbound; NSG must allow); zonal or zone-redundant (non-zonal Standard IPs are now zone-redundant in AZ regions); routing preference Internet supported; Global tier supported (cross-region load balancer)
- Zone can't be changed after creation
- Associate with: VM NIC, VMSS (use public IP prefixes), public load balancer frontend, VPN/ExpressRoute gateway, NAT gateway, Application Gateway, Azure Firewall, Bastion host, Route Server, API Management
- Static: IP assigned at creation, released only when resource deleted; can't choose the actual IP
- DNS label: <label>.<location>.cloudapp.azure.com (unique per location); Domain Name Label Scope (preview) prevents dangling DNS
- Idle timeout inbound 4–30 min (default 4)
- IPv4 nominal charge; IPv6 no charge
- LB and public IP SKUs must match; can't mix Basic/Standard
- URL: https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/public-ip-addresses

## VNet FAQ (updated 2026-07-09)
- Recommended RFC 1918 ranges (10/8, 172.16/12, 192.168/16) + RFC 6598 shared (100.64.0.0/10); can't use 224.0.0.0/4, 255.255.255.255/32, 127.0.0.0/8, 169.254.0.0/16, 168.63.129.16/32
- Azure reserves 5 IPs per subnet: first four + last: x.x.x.0 network, .1 default gateway, .2 & .3 map Azure DNS, .255 broadcast (for /24)
- Smallest IPv4 subnet /29, largest /2; IPv6 subnets exactly /64
- NSG+UDR on subnet: inbound NSG rules; outbound NSG rules then UDR
- NSG on subnet and NIC: inbound subnet NSG then NIC NSG; outbound NIC NSG then subnet NSG
- No multicast/broadcast (Layer 3 overlay, no VLANs/L2)
- Subnet can be resized/removed only if no VMs/services deployed in it; VNet address space (CIDR blocks) can be added/removed/modified
- VNet limited to a single region but spans availability zones; connect VNets via peering or VPN gateway
- Custom DNS servers set at VNet (applied to VMs; renew DHCP lease after change) or per NIC; no custom DNS suffix
- Azure-provided DNS resolves hostnames within same VNet (FQDN)
- Private IPs (ARM) don't change until deleted (static or dynamic); can't reserve a private IP for future VM; can't set static MAC
- Peering: same or different region (global), across subscriptions and tenants; no overlapping address spaces; Initiated state = only one link created (need both); Disconnected = one link deleted → delete & recreate both; Use Remote Gateway on only one peering; can't move a peered VNet (delete peering first); no charge to create, data transfer charged; no bandwidth limit; NOT transitive (A-B + B-C ≠ A-C)
- Global peering can't reach resources behind Basic LB frontend (Standard LB fine)
- Service endpoints: no additional cost; must enable on subnet AND configure service-side network rules; NSGs must allow outbound to service (service tags)
- URL: https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-faq

## NSG overview (updated 2025-10-23)
- Rule properties: Name (≤80 chars), Priority 100–4096 (lower number = higher priority; first match stops), Source/Destination (Any, IP, CIDR, service tag, ASG), Protocol (TCP, UDP, ICMP, ESP, AH, Any — ESP/AH not in portal), Direction, Port range (single, range, comma list), Action (Allow/Deny)
- Can't have two rules with same priority AND direction
- Stateful (flow records): return traffic allowed automatically
- Removing a rule doesn't break existing connections; rules affect only new connections
- Inbound NSG processed after public→private IP translation; outbound before private→public
- Default inbound: AllowVNetInBound 65000 (VirtualNetwork→VirtualNetwork Allow); AllowAzureLoadBalancerInBound 65001 (AzureLoadBalancer→Any Allow); DenyAllInbound 65500 Deny
- Default outbound: AllowVnetOutBound 65000; AllowInternetOutBound 65001 (→Internet Allow); DenyAllOutBound 65500
- Default rules can't be removed; override with higher-priority (lower number) rules
- Augmented rules: multiple IPs/ranges/ports in one rule (ARM only); can't use multiple service tags or ASGs in one rule
- Service tags e.g. VirtualNetwork, AzureLoadBalancer, Internet, Storage (regional Storage.EastUS)
- Azure Virtual Network Manager security admin rules evaluated BEFORE NSG rules ("Always allow"/"Deny" terminate evaluation)
- NSG flow logs retire Sept 30, 2027; creation of NEW NSG flow logs no longer supported → migrate to virtual network flow logs
- Platform: 168.63.129.16 & 169.254.169.254 (DHCP, DNS, IMDS, health monitoring) not subject to NSGs by default unless service tags AzurePlatformDNS/AzurePlatformIMDS/AzurePlatformLKM used; KMS licensing outbound port 1688; outbound SMTP port 25 blocked for pay-as-you-go/MSDN/free/CSP (use authenticated SMTP relay port 587); EA not blocked
- URL: https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview

## Application security groups (updated 2025-07-25)
- Group NICs by application role (e.g., AsgWeb, AsgLogic, AsgDb) and use as source/destination in NSG rules instead of IPs
- A NIC can be in multiple ASGs
- All NICs in an ASG must be in the SAME virtual network as the first NIC assigned
- If ASGs are used as both source and destination in a rule, NICs in both must be in the same VNet
- Rules only apply to NICs that are members of the referenced ASG
- Example: 100 Internet→AsgWeb TCP 80 Allow; 110 AsgLogic→AsgDb TCP 1433 Allow; 120 Any→AsgDb 1433 Deny (needed because AllowVNetInBound allows intra-VNet)
- URL: https://learn.microsoft.com/en-us/azure/virtual-network/application-security-groups

## Routing / UDR (updated 2026-06-11)
- System routes per subnet: VNet address space → Virtual network; 0.0.0.0/0 → Internet; 10/8, 172.16/12, 192.168/16, 100.64/10 (+ some others) → None (changes to Virtual network if used in VNet address space)
- Traffic to Azure services' public IPs stays on Azure backbone even with next hop Internet
- Optional system routes: Virtual network peering (all subnets), Virtual network gateway (BGP/local network gateway prefixes), VirtualNetworkServiceEndpoint (only subnets with service endpoint)
- Can't create/remove system routes; override with UDRs
- Route table associated to zero or more subnets; each subnet 0 or 1 route table; default max 400 UDRs per route table (1,000 with AVNM routing config)
- UDR next hop types: Virtual appliance (needs next hop IP: NVA NIC private IP or internal LB IP), Virtual network gateway (only VPN gateway), None (drop), Virtual network, Internet. CLI names: VirtualAppliance, VirtualNetworkGateway, None, VNetLocal, Internet
- Can't use Virtual network peering or VirtualNetworkServiceEndpoint as UDR next hop
- NVA NIC needs Azure "Enable IP forwarding" (+ OS forwarding); put NVA in a different subnet than the resources routed through it (avoid loops)
- Service tags can be address prefix in UDRs (≤25 service-tag routes per table)
- Route selection: longest prefix match; same prefix priority: UDR > BGP > system route (but VNet, peering, service endpoint system routes preferred over BGP; service endpoint routes can't be overridden)
- Overriding 0.0.0.0/0 to NVA/gateway = forced tunneling; resources no longer directly reachable from internet
- Disable "virtual network gateway route propagation" on route table (not on GatewaySubnet); don't put 0.0.0.0/0 UDR on GatewaySubnet
- Effective routes show State Active/Invalid
- PowerShell New-AzRouteConfig ; CLI az network route-table route create --next-hop-type VirtualAppliance --next-hop-ip-address 10.0.100.4
- URL: https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview

## VNet peering overview (updated 2026-08-13)
- Up to 500 peerings per VNet by default (1,000 with Azure Virtual Network Manager connectivity config)
- Types: virtual network peering (same region) and global virtual network peering (cross-region)
- Private traffic on Microsoft backbone — no public internet, gateways, or encryption needed; same-region latency like within one VNet; no extra bandwidth limit
- Works across subscriptions, Entra tenants, deployment models; no downtime creating peering
- Subnet peering (newer): peer only selected subnets
- NSGs can block/allow traffic between peered VNets (full connectivity by default)
- Resize address space of peered VNets without downtime → then SYNC the peering
- Service chaining: UDR next hop = NVA IP in peered VNet or VPN gateway (not ExpressRoute gateway) → hub-and-spoke
- Gateway transit: spoke uses hub's VPN/ER gateway; VNet using remote gateway can't have its own gateway; supported for local & global peering
- Verify peering via effective routes: next hop type "Virtual network peering"
- API properties: allowVirtualNetworkAccess, allowForwardedTraffic, allowGatewayTransit, useRemoteGateways (portal labels vary — use descriptive names)
- Pricing: nominal ingress/egress charge; gateway transit traffic charged peering on spoke
- URL: https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview

## Azure Bastion configuration (updated 2026-08-12)
- Subnet named exactly AzureBastionSubnet, /26 or larger (deployments since Nov 2, 2021), same VNet & RG as bastion host, no other resources (not required for Bastion Developer)
- Public IP: Standard SKU, Static (not needed for Developer or Private-only deployments)
- SKUs: Developer, Basic, Standard, Premium. Basic = 2 instances; Standard+ = host scaling (instance count), custom ports, shareable link; Premium = session recording (stored in storage blob container), private-only deployment
- Default ports 3389 RDP / 22 SSH; RDP/SSH via browser (TLS 443) — VMs don't need public IPs
- Native client support (az network bastion rdp/ssh) requires Standard or higher (well-established)
- AZ deployment (preview in some regions); can't change zones after deploy
- URL: https://learn.microsoft.com/en-us/azure/bastion/configuration-settings

## Private endpoint DNS (updated 2026-08-11)
- Options: hosts file (testing only), Azure Private DNS zone linked to VNet, Azure DNS Private Resolver (hybrid/on-prem)
- Public DNS CNAME redirects <account>.blob.core.windows.net → <account>.privatelink.blob.core.windows.net ; private DNS zone A record returns private IP inside linked VNets; connection string doesn't change
- Recommended zones: privatelink.blob.core.windows.net ; privatelink.file.core.windows.net ; privatelink.queue.core.windows.net ; privatelink.table.core.windows.net ; privatelink.web.core.windows.net ; privatelink.dfs.core.windows.net ; privatelink.vaultcore.azure.net (Key Vault) ; privatelink.database.windows.net (Azure SQL) ; privatelink.azurewebsites.net (+ scm.privatelink.azurewebsites.net) (App Service/Functions) ; privatelink.azurecr.io (ACR) ; privatelink.{regionName}.azurecontainerapps.io ; privatelink.siterecovery.windowsazure.com ; privatelink.{regionCode}.backup.windowsazure.com
- Automatic DNS config only when using recommended zone names (DNS zone group)
- Don't reuse one zone for private endpoints of two different services; one zone per service type
- DNS resolution ≠ access control (public network access disabled still blocks)
- With privatelink zone linked, public resources w/o private endpoint may get NXDOMAIN unless "fallback to internet" enabled
- Azure file shares connected via public endpoint must be remounted
- URL: https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns

## Private DNS autoregistration (updated 2025-09-23)
- Enable via "Enable auto registration" on the virtual network link
- Creates A records for VMs in the linked VNet (primary NIC only); records removed when VM deleted or stopped
- VMs only (not internal LBs etc. → create records manually); no PTR records
- A VNet can be linked to only ONE private DNS zone with autoregistration enabled; a zone can be linked to multiple VNets
- URL: https://learn.microsoft.com/en-us/azure/dns/private-dns-autoregistration

## Load Balancer SKUs (updated 2026-05-04)
- Basic Load Balancer RETIRED September 30, 2025 → Standard
- SKUs: Standard, Gateway (for third-party NVAs), Basic (retired)
- Standard: backend = IP-based or NIC-based; any VMs/VMSS in a single VNet; probes TCP/HTTP/HTTPS; zone-redundant or zonal frontends; public or internal; public Standard LB requires Standard public IP; secure by default (closed to inbound unless NSG allows; internal VNet traffic to ILB allowed); HA ports (internal only); outbound rules; TCP reset on idle; multiple frontends inbound+outbound; SLA 99.99%; global tier (cross-region LB) for public; supports Global VNet peering (internal), NAT gateway, Private Link
- Probe-down: TCP connections stay alive on instance probe down and all probes down (Standard)
- A VM/availability set/VMSS can reference only one SKU
- RG moves supported for Standard LB/public IP; subscription moves NOT supported for Standard LB
- URL: https://learn.microsoft.com/en-us/azure/load-balancer/skus

## Load Balancer components (updated 2026-08-17)
- Frontend IP configuration: public IP → public LB; private IP → internal LB (no internet inbound); multiple frontends allowed
- Backend pool: VMs or VMSS instances in a single VNet; add by NIC or IP; VMs don't need public IPs; multiple pools allowed
- Health probes: TCP, HTTP, HTTPS; probe failure → no NEW connections to instance; established TCP continue
- Load-balancing rules: map frontend IP:port → backend pool:port for inbound traffic to ALL instances in pool
- HA ports rule: protocol All, port 0; internal Standard LB only; all TCP/UDP (and ICMP) flows; for NVAs
- Inbound NAT rules: forward frontend IP:port to a SPECIFIC VM/instance (port forwarding e.g., RDP/SSH)
- Outbound rules: outbound SNAT for backend pool instances (Standard only)
- Distribution: 5-tuple hash (source IP, source port, destination IP, destination port, protocol); session persistence options: None, Client IP (2-tuple), Client IP and protocol (3-tuple) (well-established)
- Limitations: TCP/UDP only (ICMP only with HA ports on ILB); backend pool can't contain private endpoints; outbound flow from backend VM to its own ILB frontend fails; LB rule can't span two VNets; no IP fragment forwarding; one NIC-based public LB + one NIC-based internal LB per availability set
- URL: https://learn.microsoft.com/en-us/azure/load-balancer/components

## Load Balancer health probes (updated 2026-09-10)
- Protocols (Standard): TCP, HTTP, HTTPS. TCP probe = TCP handshake succeeds; fails on no response or TCP reset. HTTP/HTTPS = GET path must return 200 (non-200 → down); HTTP/S timeout 30 s
- Properties: Name, Protocol, Port, Interval (seconds), Threshold (consecutive successes/failures)
- Interval default: 5 s in portal; 15 s via ARM/REST/CLI/PowerShell (min 5 s)
- Failed probe → no NEW connections to that instance; existing TCP continue; outbound unaffected
- All probes down (Standard): no new flows; established TCP continue; UDP flows terminate
- Source IP 168.63.129.16 (IPv4); AzureLoadBalancer service tag allows it by default (default NSG rule AllowAzureLoadBalancerInBound) — local OS firewall must also allow; blocking probe source = instances marked down
- VM must listen on probe port; stopped instances not probed; inbound NAT rules don't need probes
- HTTP probes can't use some ports (19, 21, 25, 70, 110, 119, 143, 220, 993); HTTPS probe no client cert
- Use NSG rule blocking probe to simulate failure (but blocking probe IP not a supported steady state)
- URL: https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-custom-probe-overview

## Network Watcher (updated 2026-02-25)
- Auto-enabled in a region when you create/update a VNet (no charge for enabling); 1 instance per region per subscription (NetworkWatcherRG / NetworkWatcher_<region> — well-known naming)
- For IaaS (VMs, VNets, App Gateways, LBs) — not PaaS monitoring
- Monitoring: Topology; Connection monitor
- Diagnostic tools (7): IP flow verify (is packet allowed/denied to/from VM + which NSG rule); NSG diagnostics (VM/VMSS/App Gateway; IP/prefix/service tag; can add rule); Next hop (next hop type, IP, route table ID for a destination → routing issues); Effective security rules (NIC + subnet NSG aggregate); Connection troubleshoot (point-in-time test from VM/VMSS/App Gateway/Bastion to VM/FQDN/URI/IP); Packet capture (VM/VMSS; needs Network Watcher extension); VPN troubleshoot (gateways & connections)
- Traffic: Flow logs (NSG flow logs — retiring Sept 30, 2027, no new creation; Virtual network flow logs recommended) stored in storage; Traffic analytics (visualizes flow logs via Log Analytics)
- Limits: 100 connection monitors per region per subscription; 20 test groups & 20 test configs & 100 sources+destinations per connection monitor
- URL: https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-overview

## Connection monitor (updated 2026-08-27)
- Connection monitor (classic) deprecated/no longer available; Network Performance Monitor migrated
- Continuous end-to-end monitoring (Azure + hybrid): TCP, HTTP, ICMP checks; packet loss (% checks failed) and round-trip time (RTT); topology with hop issues
- Sources: Azure VMs & VMSS with Network Watcher Agent extension; on-prem hosts with Azure Arc agent + Azure Monitor Agent (Log Analytics agent no longer supported). Portal auto-enables extensions.
- Destinations: Azure VMs/VMSS, Arc hosts, URLs, FQDNs, IPs (no agent needed)
- Entities: connection monitor resource (regional) → test groups → sources, destinations, test configurations (protocol, port, frequency, thresholds) → tests (source×destination×config)
- States: Pass, Fail, Warning (default thresholds RTT 750 ms, checks failed 10%), Indeterminate, Not Running
- Data: Log Analytics workspace + Azure Monitor metrics (ChecksFailedPercent, RoundTripTimeMs, TestResult) → metric alert rules with action groups
- URL: https://learn.microsoft.com/en-us/azure/network-watcher/connection-monitor-overview
