# external-dannyshihnet-status-check
External status check for dannyshih.net services

## Setup
The script expects `slack-token.txt` in the same directory.

## AWS Lambda
Originally, this ran on a dedicated machine at my parent's place. Reliability and configuration difficulty were issues. The current incarnation of this check now runs solely in AWS ECR/Lambda free tier.

### Cost
We aim to operate well within the AWS Lambda Free Tier. As of July 2023, this is up to 1 million requests, 400,000 GB-secs, and 512 MB of ephemeral storage.

#### Requests
We schedule the check to run twice every hour (on the 12th and 42nd minutes), and once more at 10:45 AM as a daily status message. That's 49 requests per day, or *1,519 requests per month* - well within the 1 million limit.

#### Runtime/memory
In practice, requests complete in 6 seconds, and Lamba is configured to time out at 30 seconds. So in the worst case, we run for 45,570 seconds if every request uses the full 30 seconds.

Runs tend to use ~123 MB of RAM max, so we allocate just a bit more at 160 MB. So worst case, we use *7,292 GB-seconds per month* - well within the 400,000 GB-sec limit.

#### Ephemeral storage
The default of 512MB is free. The docker image is ~180ish MB, so that is more than adequate.

### IPv6
As of July 2023, AWS Lambda does not support IPv6 outbound connections. So the best the check can do is verify IPv4 end-to-end and resolve IPv6 DNS.
