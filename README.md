# external-dannyshihnet-status-check
External status check for dannyshih.net services

## Setup
The script expects `slack-token.txt` in the same directory.

## AWS Lambda
Originally, this ran on a dedicated machine at my parent's place. Reliability and configuration difficulty were issues. The current incarnation of this check now runs solely in AWS ECR/Lambda free tier.

### IPv6
As of July 2023, AWS Lambda does not support IPv6 outbound connections. So the best the check can do is verify IPv4 end-to-end and resolve IPv6 DNS.
