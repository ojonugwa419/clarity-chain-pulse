import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Test recording activity - owner only and input validation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Test recording as owner with valid input
    let block = chain.mineBlock([
      Tx.contractCall('chain-pulse', 'record-activity', 
        [types.uint(100), types.uint(5000000), types.uint(50)], 
        deployer.address
      )
    ]);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectUint(1);

    // Test invalid input (zero tx-count)
    block = chain.mineBlock([
      Tx.contractCall('chain-pulse', 'record-activity',
        [types.uint(0), types.uint(5000000), types.uint(50)],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(103);

    // Test recording as non-owner
    block = chain.mineBlock([
      Tx.contractCall('chain-pulse', 'record-activity',
        [types.uint(100), types.uint(5000000), types.uint(50)],
        wallet1.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(100);
  }
});

Clarinet.test({
  name: "Test getting metrics with pagination",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Record multiple entries
    let block = chain.mineBlock([
      Tx.contractCall('chain-pulse', 'record-activity',
        [types.uint(100), types.uint(5000000), types.uint(50)],
        deployer.address
      ),
      Tx.contractCall('chain-pulse', 'record-activity',
        [types.uint(200), types.uint(6000000), types.uint(60)],
        deployer.address
      )
    ]);

    // Test metrics retrieval with pagination
    const response = chain.callReadOnlyFn('chain-pulse', 'get-metrics',
      [types.uint(0), types.uint(999999999), types.uint(0)],
      deployer.address
    );
    response.result.expectOk();

    // Test invalid time range
    const invalidResponse = chain.callReadOnlyFn('chain-pulse', 'get-metrics',
      [types.uint(999999999), types.uint(0), types.uint(0)],
      deployer.address
    );
    invalidResponse.result.expectErr().expectUint(101);
  }
});

Clarinet.test({
  name: "Test generating activity report",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Record test data
    let block = chain.mineBlock([
      Tx.contractCall('chain-pulse', 'record-activity',
        [types.uint(100), types.uint(5000000), types.uint(50)],
        deployer.address
      )
    ]);

    // Test report generation for existing record
    const response = chain.callReadOnlyFn('chain-pulse', 'generate-report',
      [types.uint(1)],
      deployer.address
    );
    response.result.expectOk();

    // Test report for non-existent record
    const invalidResponse = chain.callReadOnlyFn('chain-pulse', 'generate-report',
      [types.uint(999)],
      deployer.address
    );
    invalidResponse.result.expectErr().expectUint(102);
  }
});
