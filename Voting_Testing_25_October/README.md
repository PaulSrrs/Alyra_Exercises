# Voting.sol

Some tests wrote with Hardhat framework for the Voting.sol contract.

## How to launch tests

First, please install the required packages with the following command :

```npm install``` or ```yarn install```

You also have to install hardhat, please see [how to install hardhat](https://hardhat.org/hardhat-runner/docs/getting-started#installation).

The tests are divided in 5 sections:

1. Ownership (line 21)
2. Voter registration (line 42)
3. Voter's proposal registration (line 64)
4. Voting session (line 128)
5. Vote tally (line 190)

## Launch the tests

Once the dependencies installed, you can now launch the test with the following command :

```npx hardhat test```

There are a total of 35 tests testing various behaviour.

You can also see the gas used by the contract with the [Hardhat Gas Reporter library](https://www.npmjs.com/package/hardhat-gas-reporter).

To hide gas reporting, please change the value of 'gasReporter' in the hardhat.config.js file.

## See the coverage

✅ The Voting.sol contract is covered up to 100% ✅

You can see the coverage with the following command :

```npx hardhat coverage```

It will generate terminal human-readable coverage and also a nice index.html file in a generate 'coverage' folder.<br>
You can open the index.html with any browser to see properly the coverage.


