#!/bin/bash

# Configuration
SG_ID="sg-08be074168c4c8493" # Replace with your actual SG ID
PORT="443"                        # 443 for HTTPS, 80 for HTTP

echo "Fetching latest Cloudflare IP ranges..."

# Fetch IPv4 and IPv6 ranges from Cloudflare
CF_IPV4=$(curl -s https://www.cloudflare.com/ips-v4)
CF_IPV6=$(curl -s https://www.cloudflare.com/ips-v6)

echo "Adding Cloudflare IPv4 ranges to Security Group $SG_ID on port $PORT..."
for ip in $CF_IPV4; do
    echo "Adding IPv4: $ip"
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --ip-permissions IpProtocol=tcp,FromPort=$PORT,ToPort=$PORT,IpRanges="[{CidrIp=$ip,Description='Cloudflare IPv4'}]" \
        > /dev/null 2>&1 || echo "  -> Rule may already exist."
done

echo "Adding Cloudflare IPv6 ranges to Security Group $SG_ID on port $PORT..."
for ip in $CF_IPV6; do
    echo "Adding IPv6: $ip"
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --ip-permissions IpProtocol=tcp,FromPort=$PORT,ToPort=$PORT,Ipv6Ranges="[{CidrIpv6=$ip,Description='Cloudflare IPv6'}]" \
        > /dev/null 2>&1 || echo "  -> Rule may already exist."
done

echo "✅ Success! All Cloudflare IPs have been added to your Security Group."
