import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Test recording activity - owner only",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Test recording as owner
    let block = chain.mineBlock([
      Tx.contractCall('chain-pulse', 'record-activity', 
        [types.uint(100), types.uint(5000000), types.uint(50)], 
        deployer.address
      )
    ]);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectUint(1);

    // Test recording as non-owner (should fail)
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
  name: "Test getting metrics for time period",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Record some test data
    let block = chain.mineBlock([
      Tx.contractCall('chain-pulse', 'record-activity',
        [types.uint(100), types.uint(5000000), types.uint(50)],
        deployer.address
      )
    ]);

    // Test valid time range
    const response = chain.callReadOnlyFn('chain-pulse', 'get-metrics',
      [types.uint(0), types.uint(999999999)],
      deployer.address
    );
    response.result.expectOk();

    // Test invalid time range
    const invalidResponse = chain.callReadOnlyFn('chain-pulse', 'get-metrics',
      [types.uint(999999999), types.uint(0)],
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

    // Test report generation
    const response = chain.callReadOnlyFn('chain-pulse', 'generate-report',
      [types.uint(1)],
      deployer.address
    );
    response.result.expectOk();

    // Test report for non-existent data
    const invalidResponse = chain.callReadOnlyFn('chain-pulse', 'generate-report',
      [types.uint(999999999)],
      deployer.address
    );
    invalidResponse.result.expectErr().expectUint(102);
  }
});
