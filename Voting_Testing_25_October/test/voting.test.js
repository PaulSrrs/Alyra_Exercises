const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
import chai from "chai";
import { solidity } from "ethereum-waffle";

chai.use(solidity);
const { expect } = require('chai');
const constants = require('@openzeppelin/test-helpers/src/constants');
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Voting", () => {
    let Voting;
    let owner;
    let firstVoter;
    let secondVoter;
    let thirdVoter;


    async function deployVotingFixture() {
        const VotingFactory = await ethers.getContractFactory("Voting");
        Voting = await VotingFactory.deploy();
        [owner, firstVoter, secondVoter, thirdVoter] = await ethers.getSigners();
    }

    describe('Ownership', () => {
        before(async () => {
            await loadFixture(deployVotingFixture);
        })
        it("Should be not the owner.", async () => {
            expect(owner.address).to.not.equal(firstVoter, "Owner are the same.");
        });
        it("Should be the owner.", async () => {
            const _owner = await Voting.owner();
            expect(owner.address).to.equal(_owner, "Owner are not the same.");
        });
        it("Should add a voter without revert.", async () => {
            await Voting.connect(owner);
            await Voting.addVoter(firstVoter.address);
        });
        it("Should revert while trying to add voter.", async () => {
            await Voting.connect(firstVoter);
            expectRevert(Voting.addVoter(secondVoter.address), "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.");
        });
    });

    describe('onlyVoter modifier', () => {
        before(async () => {
            await loadFixture(deployVotingFixture);
        })
        it("Should be not the owner.", async () => {
            expect(owner.address).to.not.equal(firstVoter.address, "Owner are the same.");
        });

        it("Should be the owner.", async () => {
            const _owner = await Voting.owner();
            expect(owner.address).to.equal(_owner, "Owner are not the same.");
        });
    });

    describe('Voter registration', () => {
        before(async () => {
            await loadFixture(deployVotingFixture);
        })
        it("Should add first voter and able to get it.", async () => {
            await Voting.addVoter(firstVoter.address);
            const voter = await Voting.connect(firstVoter).getVoter(firstVoter.address);
            expect(voter.isRegistered).to.equal(true);
        });
        it("Should add second owner and emit 'VoterRegistered' event.", async () => {
            expect(Voting.addVoter(secondVoter.address)).to.emit(Voting, 'VoterRegistered').withArgs(secondVoter.address)
        });
        it("Should revert because voter already registered.", async () => {
            await expectRevert(Voting.addVoter(secondVoter.address), "Already registered")
        });
        it("Should revert because voter registration closed.", async () => {
            await Voting.startProposalsRegistering();
            await expectRevert(Voting.addVoter(thirdVoter.address, {from: owner.address}), "Voters registration is not open yet")
        });
    });

    describe('Voter\'s proposal registration', () => {
        before(async () => {
            await loadFixture(deployVotingFixture);
        })
        it("Should revert because proposal session not started.", async () => {
            expectRevert(Voting.addProposal(firstVoter.address, {from: firstVoter.address}), "Proposals are not allowed yet");
        });
        it("Should revert because voter not registered.", async () => {
            expectRevert(Voting.addProposal(firstVoter.address, {from: firstVoter.address}), "You're not a voter");
        });
    });
});