import getTransactionById from '../src';
import hashes from './hashes';

describe('Test transaction fetch', () => {
  it('get random transaction by its ID', async () => {
    const { data } = await getTransactionById(
      hashes[Math.floor(Math.random() * hashes.length)],
      { log: true }
    );

    expect(data).toEqual(
      expect.objectContaining({
        HASH: expect.any(String),
        'From Address': expect.any(String),
        'To Address': expect.any(String),
        Amount: expect.any(Number),
        // 'Amount (no decimals)': expect.any(String),
        'Time of Transaction': expect.any(String),
      })
    );
  });

  it('get multiple transactions', async () => {
    const { data } = await getTransactionById(hashes.join(','));

    expect(Array.isArray(data)).toBeTruthy();
    expect(data).toEqual(
      expect.arrayContaining([
        {
          HASH: expect.any(String),
          'From Address': expect.any(String),
          'To Address': expect.any(String),
          Amount: expect.any(Number),
          // 'Amount (no decimals)': expect.any(String),
          'Time of Transaction': expect.any(String),
        },
      ])
    );
  }, 60000);

  it('returns error for invalid transaction ID', async () => {
    const { error, data } = await getTransactionById(hashes[0] + '0z');

    expect(typeof data).toEqual('undefined');
    expect(typeof error).toEqual('string');
  });
});
