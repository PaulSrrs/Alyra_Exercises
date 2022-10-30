const {
    BN,           // Big Number support
} = require('@openzeppelin/test-helpers');
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");
const {expect} = require("chai");
const {ethers} = require("hardhat");

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
            await expect(owner.address).not.to.equal(firstVoter.address, "Owner are the same.");
        });
        it("Should be the owner.", async () => {
            const _owner = await Voting.owner();
            await expect(owner.address).to.equal(_owner, "Owner are not the same.");
        });
        it("Should add a voter and emit (.", async () => {
            const addVoterTx = Voting.addVoter(firstVoter.address);
            await expect(addVoterTx).to.emit(Voting, "VoterRegistered").withArgs(firstVoter.address);
        });
        it("Should revert while trying to add voter (onlyOwner modifier).", async () => {
            const addVoterTx = Voting.connect(firstVoter).addVoter(secondVoter.address);
            await expect(addVoterTx).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe('onlyVoter modifier', () => {
        before(async () => {
            await loadFixture(deployVotingFixture);
        })
        it("Should be not the owner.", async () => {
            await expect(owner.address).not.to.equal(firstVoter.address, "Owner are the same.");
        });

        it("Should be the owner.", async () => {
            const _owner = await Voting.owner();
            await expect(owner.address).to.equal(_owner, "Owner are not the same.");
        });
    });

    describe('Voter registration', () => {
        before(async () => {
            await loadFixture(deployVotingFixture);
            await Voting.addVoter(firstVoter.address);
        })
        it("Should revert because sender can't get a voter.", async () => {
            const firstVoterFetchedRevertedTx = Voting.getVoter(firstVoter.address);
            await expect(firstVoterFetchedRevertedTx).to.be.revertedWith("You're not a voter");
        });
        it("Should able to get first voter and get his registered status as true.", async () => {
            const firstVoterFetched = await Voting.connect(firstVoter).getVoter(firstVoter.address);
            await expect(firstVoterFetched.isRegistered).to.equal(true);
        });
        it("Should revert because voter already registered.", async () => {
            await expect(Voting.addVoter(firstVoter.address)).to.be.revertedWith("Already registered");
        });
        it("Should revert because voter registration closed.", async () => {
            await Voting.startProposalsRegistering();
            await expect(Voting.addVoter(secondVoter.address)).to.be.revertedWith("Voters registration is not open yet");
        });
    });

    describe('Voter\'s proposal registration', () => {
        before(async () => {
            await loadFixture(deployVotingFixture);
            await Voting.addVoter(firstVoter.address);
        })
        it("Should revert because proposal session not started.", async () => {
            const addVoterRevertedTx = Voting.connect(firstVoter).addProposal('The first proposal');
            await expect(addVoterRevertedTx).to.be.revertedWith("Proposals are not allowed yet");
        });
        it("Should revert because sender is not a registered voter.", async () => {
            await expect(Voting.addProposal(firstVoter.address)).to.be.revertedWith("You're not a voter");
        });
        it("Should revert while trying to start proposal without ownership.", async () => {
            const startProposalRevertedTx = Voting.connect(firstVoter).startProposalsRegistering();
            await expect(startProposalRevertedTx).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it("Should start proposal sessions and emit 'WorkflowStatusChange'.", async () => {
            await expect(await Voting.workflowStatus()).to.equal(0);
            const startProposalTx = Voting.startProposalsRegistering();
            await expect(startProposalTx).to.emit(Voting, 'WorkflowStatusChange').withArgs(0, 1);
            await expect(await Voting.workflowStatus()).to.equal(1);
        });
        it("Should revert while trying to restart proposal sessions", async () => {
            const startProposalTx = Voting.startProposalsRegistering();
            await expect(startProposalTx).to.be.revertedWith("Registering proposals cant be started now");
        });
        it("Should add a valid proposal and emit 'ProposalRegistered'", async () => {
            const addProposalTx = Voting.connect(firstVoter).addProposal('The first proposal');
            await expect(addProposalTx).to.emit(Voting, "ProposalRegistered").withArgs(1);
        });
        it("Should revert while trying to add empty proposal", async () => {
            const addProposalTx = Voting.connect(firstVoter).addProposal('');
            await expect(addProposalTx).to.be.revertedWith('Vous ne pouvez pas ne rien proposer');
        });
        it("Should revert while getting the genesis proposal because sender isn't a voter.", async () => {
            const fetchedProposalRevertedTX = Voting.getOneProposal(0);
            await expect(fetchedProposalRevertedTX).to.be.revertedWith("You're not a voter");
        });
        it("Should get the genesis proposal.", async () => {
            const fetchedProposal = await Voting.connect(firstVoter).getOneProposal(0);
            await expect(fetchedProposal.description).to.be.equal('GENESIS');
            await expect(fetchedProposal.voteCount).to.be.equal(0);
        });
        it("Should get the first proposal.", async () => {
            const fetchedProposal = await Voting.connect(firstVoter).getOneProposal(1);
            await expect(fetchedProposal.description).to.be.equal('The first proposal');
            await expect(fetchedProposal.voteCount).to.be.equal(0);
        });
        it("Should revert while trying to end proposal without ownership.", async () => {
            const endProposalRevertedTx = Voting.connect(firstVoter).endProposalsRegistering();
            await expect(endProposalRevertedTx).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it("Should end the proposal sessions and emit 'WorkflowStatusChange'.", async () => {
            await expect(await Voting.workflowStatus()).to.equal(1);
            const endProposalTx = Voting.endProposalsRegistering();
            await expect(endProposalTx).to.emit(Voting, 'WorkflowStatusChange').withArgs(1, 2);
            await expect(await Voting.workflowStatus()).to.equal(2);
        });
        it("Should revert while trying to end the proposal session again.", async () => {
            const endProposalTx = Voting.endProposalsRegistering();
            await expect(endProposalTx).to.be.revertedWith('Registering proposals havent started yet');
        });
    });

    describe('Voting session', () => {
        before(async () => {
            await loadFixture(deployVotingFixture);
            await Voting.addVoter(firstVoter.address);
            await Voting.addVoter(secondVoter.address);
            await Voting.startProposalsRegistering();
            await Voting.connect(firstVoter).addProposal('First voter proposal');
            await Voting.connect(secondVoter).addProposal('Second voter proposal');
            await Voting.endProposalsRegistering();
        })
        it("Should revert while trying to vote because voting session not open.", async () => {
            await expect(Voting.connect(firstVoter).setVote(2)).to.be.revertedWith("Voting session havent started yet");
        });
        it("Should revert while trying to vote because sender not a voter.", async () => {
            await expect(Voting.setVote(2)).to.be.revertedWith("You're not a voter");
        });
        it("Should revert while trying to start voting session without ownership.", async () => {
            const startProposalRevertedTx = Voting.connect(firstVoter).startVotingSession();
            await expect(startProposalRevertedTx).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it("Should start voting session and emit 'WorkflowStatusChange'.", async () => {
            await expect(await Voting.workflowStatus()).to.equal(2);
            const startVotingSessions = await Voting.startVotingSession();
            await expect(startVotingSessions).to.emit(Voting, 'WorkflowStatusChange').withArgs(2, 3);
            await expect(await Voting.workflowStatus()).to.equal(3);
        });
        it("Should revert while trying to restart voting session.", async () => {
            const startVotingSessions = Voting.startVotingSession();
            await expect(startVotingSessions).to.be.revertedWith('Registering proposals phase is not finished');
        });
        it("Should revert because invalid vote id submitted.", async () => {
            const setVoteTx = Voting.connect(firstVoter).setVote(42);
            await expect(setVoteTx).to.be.revertedWith('Proposal not found');
        });
        it("Should submit a valid vote.", async () => {
            const voteTx = await Voting.connect(firstVoter).setVote(2);
            await expect(voteTx).to.emit(Voting, "Voted").withArgs(firstVoter.address, 2);
            const voterWhoSubmitted = await Voting.connect(firstVoter).getVoter(firstVoter.address);
            const proposalVoted = await Voting.connect(firstVoter).getOneProposal(2);
            await expect(voterWhoSubmitted.hasVoted).to.be.equal(true);
            await expect(proposalVoted.voteCount).to.be.equal(1);
        });
        it("Should revert because voter has already voted.", async () => {
            const setVoteRevertedTx = Voting.connect(firstVoter).setVote(1);
            await expect(setVoteRevertedTx).to.be.revertedWith('You have already voted');
        });
        it("Should revert while trying to end voting session without ownership.", async () => {
            const startProposalRevertedTx = Voting.connect(firstVoter).endVotingSession();
            await expect(startProposalRevertedTx).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it("Should end voting session and emit 'WorkflowStatusChange'.", async () => {
            await expect(await Voting.workflowStatus()).to.equal(3);
            const startVotingSessions = await Voting.endVotingSession();
            await expect(startVotingSessions).to.emit(Voting, 'WorkflowStatusChange').withArgs(3, 4);
            await expect(await Voting.workflowStatus()).to.equal(4);
        });
        it("Should revert while trying to end voting session again.", async () => {
            const startProposalRevertedTx = Voting.endVotingSession();
            await expect(startProposalRevertedTx).to.be.revertedWith('Voting session havent started yet');
        });
    });

    describe('Vote Tally', () => {
        it("Should revert while trying to start vote tally session without ownership.", async () => {
            const startProposalRevertedTx = Voting.connect(firstVoter).tallyVotes();
            await expect(startProposalRevertedTx).to.be.revertedWith('Ownable: caller is not the owner');
        });
        it("Should tail vote with winning proposal id equal to 2 and emit 'WorkflowStatusChange'.", async () => {
            await expect(await Voting.workflowStatus()).to.equal(4);
            const tallyVoteTx = await Voting.tallyVotes();
            const winningProposalId = await Voting.winningProposalID();

            await expect(tallyVoteTx).to.emit(Voting, 'WorkflowStatusChange').withArgs(4, 5);
            await expect(await Voting.workflowStatus()).to.equal(5);
            await expect(winningProposalId).to.be.equal(2);
        });
        it("Should revert while trying to tail vote again.", async () => {
            const tallyVoteRevertedTx = Voting.tallyVotes();
            await expect(tallyVoteRevertedTx).to.be.revertedWith('Current status is not voting session ended');
        });
    });
});