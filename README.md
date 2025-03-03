# ChainPulse
A Clarity smart contract for monitoring blockchain activity on the Stacks network.

## Features
- Track transaction counts and volume 
- Monitor active addresses
- Store historical blockchain metrics
- Generate activity reports
- Query historical data by time period

## Setup and Installation
1. Clone the repository
2. Install Clarinet (if not already installed)
3. Run `clarinet check` to verify the contract
4. Run `clarinet test` to run the test suite

## Usage Examples
```clarity
;; Record new blockchain activity
(contract-call? .chain-pulse record-activity u100 u5000000 u50)

;; Get activity metrics for a time period
(contract-call? .chain-pulse get-metrics u1684147200 u1684233600)

;; Generate activity report
(contract-call? .chain-pulse generate-report u1684147200)
```

## Dependencies
- Clarity language
- Clarinet for testing and deployment
